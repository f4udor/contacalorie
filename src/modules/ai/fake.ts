import type { AiProvider, EstimateRequest } from "./types";

/** Provider finto per sviluppo e test: risponde con ciò che gli dice `respond`. Nessuna rete. */
export function createFakeProvider(respond: (request: EstimateRequest) => unknown | Promise<unknown>): AiProvider & { calls: EstimateRequest[] } {
  const calls: EstimateRequest[] = [];
  return {
    name: "finto",
    calls,
    async estimateMeals(request) {
      calls.push(request);
      return respond(request);
    },
  };
}
