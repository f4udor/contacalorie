import { describe, expect, it } from "vitest";
import { fetchUsedToday, romeDay } from "./usage";

const ok = (rows: unknown) => async () => ({ ok: true, json: async () => rows });

describe("stime di oggi", () => {
  it("il giorno è quello di Roma, anche a cavallo della mezzanotte", () => {
    expect(romeDay(new Date("2026-01-08T09:00:00Z"))).toBe("2026-01-08");
    expect(romeDay(new Date("2026-01-08T23:30:00Z"))).toBe("2026-01-09");
  });
  it("legge il conteggio di oggi con il token dell'utente (e la chiave pubblica)", async () => {
    let seen: { url: string; headers: Record<string, string> } | null = null;
    const n = await fetchUsedToday({
      url: "https://x.supabase.co/",
      anonKey: "anon",
      token: "tok",
      now: new Date("2026-01-08T09:00:00Z"),
      doFetch: async (url, init) => {
        seen = { url, headers: init!.headers };
        return { ok: true, json: async () => [{ count: 4 }] };
      },
    });
    expect(n).toBe(4);
    expect(seen).toEqual({ url: "https://x.supabase.co/rest/v1/ai_usage?select=count&day=eq.2026-01-08", headers: { apikey: "anon", Authorization: "Bearer tok" } });
  });
  it("oggi nessuna stima: zero", async () => {
    expect(await fetchUsedToday({ url: "https://x", anonKey: "a", token: "t", doFetch: ok([]) })).toBe(0);
  });
  it("lettura non riuscita o risposta strana: null", async () => {
    expect(await fetchUsedToday({ url: "https://x", anonKey: "a", token: "t", doFetch: async () => ({ ok: false, json: async () => [] }) })).toBeNull();
    expect(await fetchUsedToday({ url: "https://x", anonKey: "a", token: "t", doFetch: ok({ no: 1 }) })).toBeNull();
    expect(await fetchUsedToday({ url: "https://x", anonKey: "a", token: "t", doFetch: ok([{ count: "boh" }]) })).toBeNull();
    expect(await fetchUsedToday({ url: "https://x", anonKey: "a", token: "t", doFetch: async () => { throw new Error("rete"); } })).toBeNull();
  });
});
