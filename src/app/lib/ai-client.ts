import { AI_MESSAGES } from "@/modules/ai";
import type { AiErrorCode, MealProposal } from "@/modules/ai";

export type EstimateResult = { ok: true; proposal: MealProposal; originalText: string } | { ok: false; code: AiErrorCode; message: string };

type Fetch = (url: string, init?: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

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
