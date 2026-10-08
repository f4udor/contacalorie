import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const call = (body: string, auth: string | null = "Bearer x") =>
  POST(new Request("http://localhost/api/ingest/health", { method: "POST", body, headers: { ...(auth ? { Authorization: auth } : {}), "Content-Type": "application/json" } }));

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/ingest/health", () => {
  it("senza Supabase: 503 con messaggio", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await call('{"passi":"2026-10-08;1"}');
    expect(res.status).toBe(503);
    expect((await res.json()).messaggio).toContain("non disponibile");
  });

  it("senza codice: 401, anche con il corpo non JSON", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chiave");
    const res = await call("non json", null);
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: false, messaggio: "Codice non valido." });
  });
});
