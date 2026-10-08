import { AiError, AI_MESSAGES } from "./types";
import type { AiErrorCode, AiProvider, EstimateRequest, MealProposal } from "./types";
import { parseProposal, validateProposal } from "./validate";

export const MAX_TEXT_LENGTH = 1000;

/** Controllo dell'accesso e del limite giornaliero, fatto sul database. */
export interface AccessGate {
  /** Vero se il token appartiene a un utente con accesso. */
  verify(token: string): Promise<boolean>;
  /** Conta una stima di oggi: vero se è ancora entro il limite, falso se il limite è già stato raggiunto. */
  consume(token: string, limit: number): Promise<boolean>;
}

export interface EstimateDeps {
  /** Null se l'AI non è configurata. */
  provider: AiProvider | null;
  /** Null se Supabase non è configurato: allora solo il provider finto di sviluppo è ammesso. */
  gate: AccessGate | null;
  dailyLimit: number;
}

export type EstimateOutcome = { status: 200; body: { proposal: MealProposal; originalText: string } } | { status: number; body: { error: { code: AiErrorCode; message: string } } };

const STATUS: Record<AiErrorCode, number> = { richiesta: 400, accesso: 401, limite: 429, "non-configurata": 503, "non-valida": 502, rete: 502 };

const fail = (code: AiErrorCode): EstimateOutcome => ({ status: STATUS[code], body: { error: { code, message: AI_MESSAGES[code] } } });

function parseRequest(body: unknown): EstimateRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (text === "" || text.length > MAX_TEXT_LENGTH) return null;
  const date = typeof b.localDate === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.localDate) : null;
  if (!date) return null;
  const check = new Date(Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3])));
  if (check.toISOString().slice(0, 10) !== b.localDate) return null;
  if (typeof b.localTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.localTime)) return null;
  const request: EstimateRequest = { text, localDate: b.localDate as string, localTime: b.localTime };
  const hasPrevious = b.previous !== undefined && b.previous !== null;
  const hasCorrection = b.correction !== undefined && b.correction !== null;
  if (hasPrevious !== hasCorrection) return null;
  if (hasPrevious) {
    const previous = parseProposal(b.previous);
    const correction = typeof b.correction === "string" ? b.correction.trim() : "";
    if (!previous || correction === "" || correction.length > MAX_TEXT_LENGTH) return null;
    request.previous = previous;
    request.correction = correction;
  }
  return request;
}

/** Dice se la stima automatica è disponibile (provider configurato e, senza Supabase, solo il provider finto). */
export function isAiAvailable(deps: Pick<EstimateDeps, "provider" | "gate">): boolean {
  return deps.provider !== null && (deps.gate !== null || deps.provider.name === "finto");
}

/** Gestisce una richiesta di stima: accesso, limite, modello, validazione. Nessuna chiamata di rete se non quella del provider. */
export async function handleEstimate(deps: EstimateDeps, authorization: string | null, body: unknown): Promise<EstimateOutcome> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
  if (deps.gate) {
    if (!token || !(await deps.gate.verify(token).catch(() => false))) return fail("accesso");
  }
  if (!deps.provider || !isAiAvailable(deps)) return fail("non-configurata");
  const request = parseRequest(body);
  if (!request) return fail("richiesta");
  if (deps.gate) {
    let allowed: boolean;
    try {
      allowed = await deps.gate.consume(token!, deps.dailyLimit);
    } catch {
      return fail("rete");
    }
    if (!allowed) return fail("limite");
  }
  try {
    const proposal = validateProposal(await deps.provider.estimateMeals(request));
    return { status: 200, body: { proposal, originalText: request.text } };
  } catch (e) {
    return fail(e instanceof AiError ? e.code : "rete");
  }
}
