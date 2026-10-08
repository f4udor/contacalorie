import type { MealSlot } from "@/engine";

/** Un piatto stimato dal modello. */
export interface EstimatedDish {
  name: string;
  /** Quantità in testo (es. "150 g", "1 porzione"); null se non c'è. */
  quantity: string | null;
  /** Vero se l'utente non l'ha detta e il modello ha ipotizzato una porzione standard. */
  quantityAssumed: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
  /** Nota breve del modello (es. "ho ipotizzato un piatto da 80 g di pasta"). */
  note: string;
}

/** I piatti stimati di una fascia. */
export interface EstimatedMeal {
  slot: MealSlot;
  dishes: EstimatedDish[];
}

/** Proposta di pasti: nulla è salvato finché l'utente non conferma. */
export interface MealProposal {
  meals: EstimatedMeal[];
}

/** Ciò che arriva al modello: solo il testo dell'utente, data e ora locali, ed eventualmente la stima precedente con la correzione. */
export interface EstimateRequest {
  text: string;
  /** Data locale AAAA-MM-GG. */
  localDate: string;
  /** Ora locale HH:MM (per dedurre la fascia). */
  localTime: string;
  previous?: MealProposal;
  correction?: string;
}

/** Unica porta verso un modello AI. Restituisce la risposta grezza (JSON già letto): la valida chi la chiama. */
export interface AiProvider {
  readonly name: string;
  estimateMeals(request: EstimateRequest): Promise<unknown>;
}

export type AiErrorCode = "non-configurata" | "non-valida" | "rete" | "richiesta" | "accesso" | "limite";

export const AI_MESSAGES: Record<AiErrorCode, string> = {
  "non-configurata": "Stima automatica non disponibile.",
  "non-valida": "La stima ricevuta non è utilizzabile. Riprova, magari con parole diverse.",
  rete: "Non riesco a raggiungere il servizio di stima: controlla la connessione e riprova.",
  richiesta: "La richiesta non è valida.",
  accesso: "Non hai effettuato l'accesso.",
  limite: "Hai raggiunto il limite di stime di oggi. Riprova domani o inserisci i numeri a mano.",
};

/** Errore con un messaggio già pronto da mostrare. */
export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string = AI_MESSAGES[code],
  ) {
    super(message);
    this.name = "AiError";
  }
}
