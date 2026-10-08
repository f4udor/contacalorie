import { describe, expect, it } from "vitest";
import { SupabaseAiGate } from "./ai-gate";

function gate(opts: { user?: boolean; rpc?: { data: unknown; error: unknown } } = {}) {
  const tokens: string[] = [];
  const rpcs: { name: string; args: unknown }[] = [];
  const g = new SupabaseAiGate(async (token) => {
    tokens.push(token);
    return {
      auth: { getUser: async () => ({ data: { user: opts.user === false ? null : { id: "u1" } }, error: opts.user === false ? { message: "jwt" } : null }) },
      rpc: async (name, args) => {
        rpcs.push({ name, args });
        return opts.rpc ?? { data: 1, error: null };
      },
    };
  });
  return { g, tokens, rpcs };
}

describe("SupabaseAiGate", () => {
  it("verify: vero con un utente, falso senza", async () => {
    expect(await gate().g.verify("t")).toBe(true);
    expect(await gate({ user: false }).g.verify("t")).toBe(false);
  });
  it("consume: chiama la funzione del database con il limite e il token dell'utente", async () => {
    const { g, tokens, rpcs } = gate({ rpc: { data: 5, error: null } });
    expect(await g.consume("tok", 60)).toBe(true);
    expect(tokens).toEqual(["tok"]);
    expect(rpcs).toEqual([{ name: "use_ai_estimate", args: { p_limit: 60 } }]);
  });
  it("consume: -1 = limite raggiunto", async () => {
    expect(await gate({ rpc: { data: -1, error: null } }).g.consume("t", 60)).toBe(false);
  });
  it("consume: errore del database → eccezione (la richiesta non passa)", async () => {
    await expect(gate({ rpc: { data: null, error: { message: "x" } } }).g.consume("t", 60)).rejects.toThrow();
  });
});
