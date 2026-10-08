import { createFakeProvider } from "./fake";
import { VertexProvider } from "./vertex";
import type { ServiceAccount } from "./vertex";
import type { AiProvider } from "./types";

type Env = Record<string, string | undefined>;

export const DEFAULT_DAILY_LIMIT = 60;

/** Il provider scelto dalle variabili d'ambiente (solo lato server); null se l'AI non è configurata. */
export function createProviderFromEnv(env: Env): AiProvider | null {
  if (env.AI_PROVIDER === "fake") return createFakeProvider(demoResponse);
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

/** Risposta fissa del provider finto di sviluppo: un solo piatto, con la fascia dedotta dall'ora. */
function demoResponse(request: { text: string; localTime: string }) {
  const hour = Number(request.localTime.slice(0, 2));
  const slot = hour < 10 ? "colazione" : hour < 16 ? "pranzo" : hour < 18 ? "spuntino" : "cena";
  return {
    meals: [{ slot, dishes: [{ name: request.text.slice(0, 60), quantity: "100 g pasta a crudo, 80 g sugo di pomodoro, 5 g olio", quantityAssumed: true, kcal: 400, protein: 20, carbs: 45, fat: 15, fiber: 5, salt: 1.5, note: "Stima di prova (provider finto)." }] }],
  };
}
