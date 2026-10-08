import { describe, expect, it } from "vitest";
import { SupabaseHealthGate } from "./health-gate";

const args = { code: "c", rows: [{ date: "2026-10-08", steps: 1 }], limit: 200, discarded: 2, failure: null };

function gateWith(reply: { data: unknown; error: unknown }) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const gate = new SupabaseHealthGate(async () => ({
    rpc: async (name, a) => {
      calls.push({ name, args: a });
      return reply;
    },
  }));
  return { gate, calls };
}

describe("SupabaseHealthGate", () => {
  it("chiama la funzione del database con codice, righe, limite e scartate", async () => {
    const { gate, calls } = gateWith({ data: { status: "ok", saved: [{ date: "2026-10-08", steps: 1 }], kept: [] }, error: null });
    expect(await gate.ingest(args)).toEqual({ status: "ok", saved: [{ date: "2026-10-08", steps: 1 }], kept: [] });
    expect(calls).toEqual([{ name: "ingest_health", args: { p_code: "c", p_rows: args.rows, p_limit: 200, p_discarded: 2, p_failure: null } }]);
  });
  it.each(["unauthorized", "limit", "failed"])("%s", async (status) => {
    expect(await gateWith({ data: { status }, error: null }).gate.ingest(args)).toEqual({ status });
  });
  it("errore del server o risposta strana: eccezione", async () => {
    await expect(gateWith({ data: null, error: { message: "x" } }).gate.ingest(args)).rejects.toThrow();
    await expect(gateWith({ data: { status: "boh" }, error: null }).gate.ingest(args)).rejects.toThrow();
  });
});
