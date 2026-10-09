import { AI_MESSAGES } from "@/modules/ai";
import type { AiErrorCode, MealProposal } from "@/modules/ai";
import { sumProposal } from "./proposal-form";
import type { DishNumberKey } from "./proposal-form";

export type EstimateResult = { ok: true; proposal: MealProposal; originalText: string } | { ok: false; code: AiErrorCode; message: string };

type Fetch = (url: string, init?: { method: string; headers: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const pad = (n: number) => String(n).padStart(2, "0");

/** Data e ora locali di `now`, nel formato che si aspetta il server. */
export function localDateTime(now: Date): { localDate: string; localTime: string } {
  return { localDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, localTime: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
}

export interface EstimateInput {
  text: string;
  /** Stima da correggere e la correzione, insieme. */
  previous?: MealProposal;
  correction?: string;
}

/** Chiede la stima al server. Ogni errore diventa un messaggio chiaro; il testo scritto resta a chi chiama. */
export async function requestEstimate(
  input: EstimateInput,
  getToken: (() => Promise<string | null>) | null,
  doFetch: Fetch = fetch as unknown as Fetch,
  now: Date = new Date(),
): Promise<EstimateResult> {
  try {
    const token = getToken ? await getToken() : null;
    const res = await doFetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ...input, ...localDateTime(now) }),
    });
    const body = (await res.json().catch(() => null)) as { proposal?: MealProposal; originalText?: string; error?: { code?: AiErrorCode; message?: string } } | null;
    if (res.ok && body?.proposal) return { ok: true, proposal: body.proposal, originalText: body.originalText ?? input.text };
    const code = body?.error?.code && body.error.code in AI_MESSAGES ? body.error.code : "rete";
    return { ok: false, code, message: body?.error?.message ?? AI_MESSAGES[code] };
  } catch {
    return { ok: false, code: "rete", message: AI_MESSAGES.rete };
  }
}

/** Chiede al server se la stima automatica è attiva. In caso di dubbio (rete assente) dice di sì: l'errore comparirà al momento della stima. */
export async function fetchAiAvailable(doFetch: Fetch = fetch as unknown as Fetch): Promise<boolean> {
  try {
    const res = await doFetch("/api/estimate");
    const body = (await res.json()) as { available?: boolean };
    return res.ok ? body.available === true : false;
  } catch {
    return true;
  }
}

export type DishEstimateResult = { ok: true; numbers: Record<DishNumberKey, number>; note: string } | { ok: false; code: AiErrorCode; message: string };

/** Stima i numeri di un piatto scritto a mano, dal nome e dalla quantità. Se il modello li divide in più piatti si sommano. */
export async function estimateDish(
  name: string,
  quantity: string,
  getToken: (() => Promise<string | null>) | null,
  doFetch?: Fetch,
  now?: Date,
): Promise<DishEstimateResult> {
  const n = name.trim();
  const q = quantity.trim();
  const r = await requestEstimate({ text: q ? `${n}, ${q}` : n }, getToken, doFetch, now);
  if (!r.ok) return r;
  const { notes, ...numbers } = sumProposal(r.proposal);
  return { ok: true, numbers, note: notes.join(" ") };
}

/** Ciò che il server dice della stima automatica (per la pagina Collegamenti): attiva o no, nome leggibile del modello, limite al giorno e stime di oggi. */
export interface AiInfo {
  available: boolean;
  model: string | null;
  limit: number | null;
  usedToday: number | null;
}

/** Chiede al server lo stato della stima automatica, con il token dell'utente se c'è (serve a contare le stime di oggi). Null se non si riesce a leggere. */
export async function fetchAiInfo(getToken: (() => Promise<string | null>) | null, doFetch: Fetch = fetch as unknown as Fetch): Promise<AiInfo | null> {
  try {
    const token = getToken ? await getToken() : null;
    const res = await doFetch("/api/estimate", { method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const body = (await res.json()) as { available?: unknown; model?: unknown; limit?: unknown; usedToday?: unknown };
    if (!res.ok) return null;
    return {
      available: body.available === true,
      model: typeof body.model === "string" && body.model !== "" ? body.model : null,
      limit: typeof body.limit === "number" ? body.limit : null,
      usedToday: typeof body.usedToday === "number" ? body.usedToday : null,
    };
  } catch {
    return null;
  }
}
