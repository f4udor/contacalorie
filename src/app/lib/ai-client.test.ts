import { describe, expect, it } from "vitest";
import { estimateDish, fetchAiAvailable, localDateTime, requestEstimate } from "./ai-client";

const proposal = { meals: [{ slot: "pranzo", dishes: [{ name: "Pera", quantity: null, quantityAssumed: true, kcal: 80, protein: 0.5, carbs: 21, fat: 0.2, fiber: 4, salt: 0, note: "" }] }] };
type Init = { method: string; headers: Record<string, string>; body?: string };
const reply = (status: number, body: unknown) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe("localDateTime", () => {
  it("data e ora locali con gli zeri", () => {
    expect(localDateTime(new Date(2026, 0, 8, 7, 5))).toEqual({ localDate: "2026-01-08", localTime: "07:05" });
  });
});

describe("requestEstimate", () => {
  it("manda testo, data, ora e la chiave di accesso; restituisce la proposta", async () => {
    let seen: { url: string; init?: Init } | null = null;
    const f = async (url: string, init?: Init) => {
      seen = { url, init };
      return { ok: true, status: 200, json: async () => ({ proposal, originalText: "una pera" }) };
    };
    const r = await requestEstimate({ text: "una pera" }, async () => "tok", f, new Date(2026, 0, 8, 12, 30));
    expect(r).toEqual({ ok: true, proposal, originalText: "una pera" });
    expect(seen!.url).toBe("/api/estimate");
    expect(seen!.init!.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(seen!.init!.body ?? "")).toEqual({ text: "una pera", localDate: "2026-01-08", localTime: "12:30" });
  });

  it("senza chiave (accesso non richiesto) non manda l'intestazione; con la correzione manda anche la stima precedente", async () => {
    let init: Init | undefined;
    const f = async (_u: string, i?: Init) => {
      init = i;
      return { ok: true, status: 200, json: async () => ({ proposal }) };
    };
    await requestEstimate({ text: "una pera", previous: proposal as never, correction: "piccola" }, null, f);
    expect(init!.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init!.body ?? "")).toMatchObject({ correction: "piccola", previous: proposal });
  });

  it.each([
    [429, { error: { code: "limite", message: "Limite raggiunto." } }, "limite", "Limite raggiunto."],
    [503, { error: { code: "non-configurata", message: "Stima automatica non disponibile." } }, "non-configurata", "Stima automatica non disponibile."],
    [502, { error: { code: "non-valida", message: "Non utilizzabile." } }, "non-valida", "Non utilizzabile."],
    [500, null, "rete", "Non riesco a raggiungere il servizio di stima: controlla la connessione e riprova."],
    [502, { error: { code: "inventato" } }, "rete", "Non riesco a raggiungere il servizio di stima: controlla la connessione e riprova."],
  ])("errore %s", async (status, body, code, message) => {
    expect(await requestEstimate({ text: "x" }, null, reply(status, body))).toEqual({ ok: false, code, message });
  });

  it("rete assente: messaggio chiaro, nessuna eccezione", async () => {
    const r = await requestEstimate({ text: "x" }, null, async () => {
      throw new Error("offline");
    });
    expect(r).toMatchObject({ ok: false, code: "rete" });
  });

  it("errore nel leggere la chiave di accesso: messaggio chiaro", async () => {
    const r = await requestEstimate({ text: "x" }, async () => {
      throw new Error("boom");
    }, reply(200, { proposal }));
    expect(r).toMatchObject({ ok: false, code: "rete" });
  });
});

describe("fetchAiAvailable", () => {
  it("legge available", async () => {
    expect(await fetchAiAvailable(reply(200, { available: true }))).toBe(true);
    expect(await fetchAiAvailable(reply(200, { available: false }))).toBe(false);
  });
  it("rete assente: si lascia provare (l'errore comparirà alla stima)", async () => {
    expect(await fetchAiAvailable(async () => { throw new Error("x"); })).toBe(true);
  });
});

describe("estimateDish", () => {
  it("manda nome e quantità come testo e somma i numeri dei piatti", async () => {
    let init: Init | undefined;
    const two = { meals: [{ slot: "pranzo", dishes: [{ ...proposal.meals[0].dishes[0], kcal: 300, note: "pasta" }, { ...proposal.meals[0].dishes[0], kcal: 180, note: "pesto" }] }] };
    const f = async (_u: string, i?: Init) => {
      init = i;
      return { ok: true, status: 200, json: async () => ({ proposal: two }) };
    };
    const r = await estimateDish(" Spaghetti al pesto ", "80 g", null, f);
    expect(JSON.parse(init!.body ?? "").text).toBe("Spaghetti al pesto, 80 g");
    expect(r).toMatchObject({ ok: true, numbers: { kcal: 480, protein: 1, carbs: 42 }, note: "pasta pesto" });
  });
  it("senza quantità il testo è solo il nome; gli errori passano com'erano", async () => {
    let init: Init | undefined;
    await estimateDish("Pera", "  ", null, async (_u, i) => {
      init = i;
      return { ok: true, status: 200, json: async () => ({ proposal }) };
    });
    expect(JSON.parse(init!.body ?? "").text).toBe("Pera");
    expect(await estimateDish("Pera", "", null, reply(429, { error: { code: "limite", message: "Limite raggiunto." } }))).toEqual({ ok: false, code: "limite", message: "Limite raggiunto." });
  });
});

describe("fetchAiInfo (T6.5)", () => {
  const reply = (body: unknown, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => body });
  it("legge stato, nome del modello, limite e stime di oggi", async () => {
    const { fetchAiInfo } = await import("./ai-client");
    expect(await fetchAiInfo(null, reply({ available: true, model: "Gemini 2.5 Flash", limit: 60, usedToday: 4 }))).toEqual({ available: true, model: "Gemini 2.5 Flash", limit: 60, usedToday: 4 });
  });
  it("senza modello configurato: nessun nome; senza conteggio: nessun numero", async () => {
    const { fetchAiInfo } = await import("./ai-client");
    expect(await fetchAiInfo(null, reply({ available: false, model: null, limit: 60, usedToday: null }))).toEqual({ available: false, model: null, limit: 60, usedToday: null });
  });
  it("manda il token dell'utente, se c'è", async () => {
    const { fetchAiInfo } = await import("./ai-client");
    let auth: string | undefined;
    await fetchAiInfo(async () => "tok", async (_url, init) => {
      auth = init?.headers.Authorization;
      return { ok: true, status: 200, json: async () => ({ available: true }) };
    });
    expect(auth).toBe("Bearer tok");
  });
  it("lettura non riuscita: null", async () => {
    const { fetchAiInfo } = await import("./ai-client");
    expect(await fetchAiInfo(null, reply({}, false))).toBeNull();
    expect(await fetchAiInfo(null, async () => { throw new Error("rete"); })).toBeNull();
  });
});
