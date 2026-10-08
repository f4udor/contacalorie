import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, AuthError, DEMO_AUTH_KEY, DEMO_CODE, DemoAuthService, SupabaseAuthService, isValidCode, isValidEmail, normalizeCode, normalizeEmail } from "./auth";
import type { SupabaseAuthLike } from "./auth";
import { createAuthService } from "./auth-factory";

class MemStorage {
  items = new Map<string, string>();
  getItem(k: string) {
    return this.items.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.items.set(k, v);
  }
}

/** Client di accesso finto: il codice giusto è "123456"; tiene un solo utente. */
function fakeClient(opts: { offline?: boolean; signInError?: { message: string; status?: number } } = {}) {
  let session: { user: { email: string } } | null = null;
  const listeners = new Set<(e: string, s: typeof session) => void>();
  const sent: string[] = [];
  const client: SupabaseAuthLike = {
    auth: {
      getSession: async () => ({ data: { session } }),
      signInWithOtp: async ({ email }) => {
        if (opts.offline) throw new TypeError("Failed to fetch");
        if (opts.signInError) return { error: opts.signInError };
        sent.push(email);
        return { error: null };
      },
      verifyOtp: async ({ email, token }) => {
        if (opts.offline) throw new TypeError("Failed to fetch");
        if (token !== "123456") return { data: { session: null }, error: { message: "Token has expired or is invalid", status: 403 } };
        session = { user: { email } };
        for (const l of listeners) l("SIGNED_IN", session);
        return { data: { session }, error: null };
      },
      signOut: async () => {
        session = null;
        for (const l of listeners) l("SIGNED_OUT", null);
        return { error: null };
      },
      onAuthStateChange: (cb) => {
        listeners.add(cb);
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
      },
    },
  };
  return { client, sent };
}

describe("controlli di email e codice", () => {
  it("email", () => {
    expect(isValidEmail("mauro@example.com")).toBe(true);
    expect(isValidEmail("  Mauro@Example.COM ")).toBe(true);
    expect(isValidEmail("mauro@example")).toBe(false);
    expect(isValidEmail("mauro example@x.it")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(normalizeEmail("  Mauro@Example.COM ")).toBe("mauro@example.com");
  });
  it("il codice tiene solo le cifre e deve essere di 6", () => {
    expect(normalizeCode("123 456")).toBe("123456");
    expect(normalizeCode("123-456\n")).toBe("123456");
    expect(isValidCode("123 456")).toBe(true);
    expect(isValidCode("12345")).toBe(false);
    expect(isValidCode("1234567")).toBe(false);
    expect(isValidCode("abcdef")).toBe(false);
  });
});

describe("SupabaseAuthService", () => {
  const make = (opts = {}) => {
    const f = fakeClient(opts);
    return { ...f, service: new SupabaseAuthService(async () => f.client) };
  };

  it("senza accesso: nessuna sessione", async () => {
    expect(await make().service.getSession()).toBeNull();
  });

  it("flusso completo: codice richiesto, verificato, sessione attiva, uscita", async () => {
    const { service, sent } = make();
    await service.requestCode("  Mauro@Example.com ");
    expect(sent).toEqual(["mauro@example.com"]);
    const s = await service.verifyCode("mauro@example.com", "123 456");
    expect(s).toEqual({ email: "mauro@example.com" });
    expect(await service.getSession()).toEqual({ email: "mauro@example.com" });
    await service.signOut();
    expect(await service.getSession()).toBeNull();
  });

  it("email non valida: errore, nessun invio", async () => {
    const { service, sent } = make();
    await expect(service.requestCode("non-una-email")).rejects.toMatchObject({ code: "email", message: AUTH_MESSAGES.email });
    expect(sent).toEqual([]);
  });

  it("codice sbagliato, scaduto o incompleto: errore sul codice, nessuna sessione", async () => {
    const { service } = make();
    await expect(service.verifyCode("a@b.it", "000000")).rejects.toMatchObject({ code: "codice" });
    await expect(service.verifyCode("a@b.it", "123")).rejects.toMatchObject({ code: "codice" });
    expect(await service.getSession()).toBeNull();
  });

  it("troppe richieste: messaggio dedicato", async () => {
    const { service } = make({ signInError: { message: "For security purposes, you can only request this after 52 seconds", status: 429 } });
    await expect(service.requestCode("a@b.it")).rejects.toMatchObject({ code: "limite", message: AUTH_MESSAGES.limite });
  });

  it("rete assente: errore di rete chiaro; la sessione non letta vale 'nessuna'", async () => {
    const { service } = make({ offline: true });
    await expect(service.requestCode("a@b.it")).rejects.toMatchObject({ code: "rete" });
    await expect(service.verifyCode("a@b.it", "123456")).rejects.toMatchObject({ code: "rete" });
    const broken = new SupabaseAuthService(async () => {
      throw new Error("client non caricato");
    });
    expect(await broken.getSession()).toBeNull();
  });

  it("onChange avvisa di accesso e uscita e smette quando richiesto", async () => {
    const { service } = make();
    const seen: (string | null)[] = [];
    const stop = service.onChange((s) => seen.push(s?.email ?? null));
    await new Promise((r) => setTimeout(r, 0));
    await service.verifyCode("a@b.it", "123456");
    await service.signOut();
    stop();
    await service.verifyCode("c@d.it", "123456");
    expect(seen).toEqual(["a@b.it", null]);
  });

  it("l'errore è un AuthError", async () => {
    const { service } = make();
    await expect(service.verifyCode("a@b.it", "000000")).rejects.toBeInstanceOf(AuthError);
  });

  it("getAccessToken: la chiave della sessione, null senza sessione o con errore", async () => {
    const withSession: SupabaseAuthLike = { auth: { ...fakeClient().client.auth, getSession: async () => ({ data: { session: { access_token: "abc", user: { email: "a@b.it" } } } }) } };
    expect(await new SupabaseAuthService(async () => withSession).getAccessToken()).toBe("abc");
    expect(await make().service.getAccessToken()).toBeNull();
    expect(await new SupabaseAuthService(async () => { throw new Error("x"); }).getAccessToken()).toBeNull();
  });
});

describe("modalità dimostrativa e scelta del servizio", () => {
  it("accesso dimostrativo: nessuna chiave per le stime", async () => {
    expect(await new DemoAuthService(new MemStorage()).getAccessToken()).toBeNull();
  });

  it("senza Supabase e senza la chiave dimostrativa: nessun accesso richiesto", () => {
    expect(createAuthService({ url: undefined, anonKey: undefined }, new MemStorage())).toBeNull();
  });

  it("con Supabase configurato: accesso vero (anche se c'è la chiave dimostrativa)", () => {
    const st = new MemStorage();
    st.setItem(DEMO_AUTH_KEY, JSON.stringify({ session: null }));
    expect(createAuthService({ url: "https://x.supabase.co", anonKey: "chiave" }, st)?.kind).toBe("supabase");
  });

  it("senza Supabase ma con la chiave dimostrativa: accesso finto", async () => {
    const st = new MemStorage();
    st.setItem(DEMO_AUTH_KEY, JSON.stringify({ session: null }));
    const s = createAuthService({ url: undefined, anonKey: undefined }, st)!;
    expect(s.kind).toBe("demo");
    expect(await s.getSession()).toBeNull();
    await expect(s.verifyCode("a@b.it", "000000")).rejects.toMatchObject({ code: "codice" });
    expect(await s.verifyCode("A@B.it", DEMO_CODE)).toEqual({ email: "a@b.it" });
    expect(await new DemoAuthService(st).getSession()).toEqual({ email: "a@b.it" });
    await s.signOut();
    expect(await s.getSession()).toBeNull();
  });

  it("la modalità dimostrativa avvisa dei cambi e rifiuta email non valide", async () => {
    const st = new MemStorage();
    const s = new DemoAuthService(st);
    const seen: (string | null)[] = [];
    const stop = s.onChange((x) => seen.push(x?.email ?? null));
    await expect(s.requestCode("no")).rejects.toMatchObject({ code: "email" });
    await s.verifyCode("a@b.it", DEMO_CODE);
    await s.signOut();
    stop();
    expect(seen).toEqual(["a@b.it", null]);
  });
});
