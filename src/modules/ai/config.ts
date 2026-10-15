import { createFakeProvider, demoEstimate } from "./fake";
import { VertexProvider } from "./vertex";
import type { ServiceAccount } from "./vertex";
import type { AiProvider } from "./types";

type Env = Record<string, string | undefined>;

export const DEFAULT_DAILY_LIMIT = 60;

/** Il provider scelto dalle variabili d'ambiente (solo lato server); null se l'AI non è configurata. */
export function createProviderFromEnv(env: Env): AiProvider | null {
  if (env.AI_PROVIDER === "fake") return createFakeProvider(demoEstimate);
  const project = env.VERTEX_PROJECT?.trim();
  const region = env.VERTEX_REGION?.trim();
  const model = env.VERTEX_MODEL?.trim();
  const rawKey = env.VERTEX_CREDENTIALS_JSON?.trim();
  if (!project || !region || !model || !rawKey) return null;
  let credentials: ServiceAccount;
  try {
    const parsed = JSON.parse(rawKey) as Partial<ServiceAccount>;
    if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") return null;
    credentials = { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
  return new VertexProvider({ project, region, model, credentials });
}

/** Limite di stime al giorno per utente (variabile `AI_DAILY_LIMIT`, predefinito 60). */
export function dailyLimitFromEnv(env: Env): number {
  const n = Number(env.AI_DAILY_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

