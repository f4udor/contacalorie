import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const call = (body: unknown) => POST(new Request("http://localhost/api/estimate", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));
const body = { text: "una pera", localDate: "2026-01-08", localTime: "12:00" };

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/estimate", () => {
  it("senza variabili dell'AI: 503 con il messaggio chiaro", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("VERTEX_PROJECT", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await call(body);
    expect(res.status).toBe(503);
    expect((await res.json()).error.message).toBe("Stima automatica non disponibile.");
  });

  it("con il provider finto e senza Supabase: 200 con una proposta", async () => {
    vi.stubEnv("AI_PROVIDER", "fake");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await call(body);
    expect(res.status).toBe(200);
    expect((await res.json()).proposal.meals[0].slot).toBe("pranzo");
  });

  it("con Supabase configurato e senza accesso: 401, anche col provider finto", async () => {
    vi.stubEnv("AI_PROVIDER", "fake");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect((await call(body)).status).toBe(401);
  });

  it("corpo non JSON: 400", async () => {
    vi.stubEnv("AI_PROVIDER", "fake");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const res = await POST(new Request("http://localhost/api/estimate", { method: "POST", body: "non json" }));
    expect(res.status).toBe(400);
  });

  it("GET dice se la stima è attiva, con il nome del modello e il limite", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("VERTEX_PROJECT", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(await (await GET()).json()).toEqual({ available: false, model: null, limit: 60, usedToday: null });
    vi.stubEnv("AI_PROVIDER", "fake");
    expect(await (await GET()).json()).toEqual({ available: true, model: "Modello di prova", limit: 60, usedToday: null });
  });

  it("GET con il limite configurato lo dice; senza modello configurato non c'è nome", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("VERTEX_PROJECT", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("AI_DAILY_LIMIT", "25");
    expect((await (await GET()).json()).limit).toBe(25);
  });

  it("GET con Supabase e il token dell'utente legge le stime di oggi (e non espone altro)", async () => {
    vi.stubEnv("AI_PROVIDER", "fake");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [{ count: 4 }] }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://localhost/api/estimate", { headers: { Authorization: "Bearer tok" } }));
    expect(await res.json()).toEqual({ available: true, model: "Modello di prova", limit: 60, usedToday: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    // Senza token: il conteggio non si legge.
    expect((await (await GET(new Request("http://localhost/api/estimate"))).json()).usedToday).toBeNull();
  });
});
