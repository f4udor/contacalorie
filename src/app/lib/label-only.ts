import type { FavoriteDish, FavoriteMeal } from "@/data";
import type { MealSlot, SaidQuantity } from "@/engine";
import type { FavoriteMention, MealProposal } from "@/modules/ai";
import { buildModelText } from "./favorite-text";
import type { ModelText, Segment } from "./favorite-text";

/** Un'etichetta del campo con la quantità semplice detta dopo di lei. */
export interface LabelItem {
  kind: "dish" | "meal";
  favoriteId: string;
  /** Quantità detta dopo un piatto; sempre null per un pasto (una quantità dopo un pasto si ignora). */
  said: SaidQuantity;
}

const NUMBER = "(\\d+(?:[.,]\\d+)?)";
const GRAMS = new RegExp(`^${NUMBER}\\s*g$`, "i");
const SERVINGS = new RegExp(`^${NUMBER}\\s*porzion[ei]$`, "i");
const TIMES = new RegExp(`^[x×]\\s*${NUMBER}$`, "i");

const toNumber = (t: string): number => Number(t.replace(",", "."));

/**
 * Le quantità semplici di BRIEF §4.1: «150 g», «150g», «2 porzioni», «1 porzione», «×2», «x2», «mezza porzione», «una porzione».
 * Testo vuoto → null (nessuna quantità); una quantità non positiva o qualunque altra parola → "no" (non è una quantità semplice).
 */
export function parseSimpleQuantity(text: string): SaidQuantity | "no" {
  const t = text.trim().replace(/\s+/g, " ");
  if (t === "") return null;
  if (/^mezza porzione$/i.test(t)) return { unit: "porzioni", amount: 0.5 };
  if (/^una porzione$/i.test(t)) return { unit: "porzioni", amount: 1 };
  const g = GRAMS.exec(t);
  if (g) return toNumber(g[1]) > 0 ? { unit: "g", amount: toNumber(g[1]) } : "no";
  const p = SERVINGS.exec(t) ?? TIMES.exec(t);
  if (p) return toNumber(p[1]) > 0 ? { unit: "porzioni", amount: toNumber(p[1]) } : "no";
  return "no";
}

/**
 * Se il campo contiene solo etichette e quantità semplici dopo ciascun piatto (BRIEF §4.1, «solo etichette, niente AI») restituisce le etichette
 * nell'ordine; altrimenti null: la frase va al modello come sempre (basta una parola in più, o del testo prima della prima etichetta).
 */
export function labelOnlyPlan(segments: readonly Segment[]): LabelItem[] | null {
  const items: LabelItem[] = [];
  for (const s of segments) {
    if (s.kind === "favorite") {
      items.push({ kind: s.favoriteKind === "meal" ? "meal" : "dish", favoriteId: s.favoriteId, said: null });
      continue;
    }
    const last = items[items.length - 1];
    if (!last) {
      if (s.text.trim() !== "") return null;
      continue;
    }
    const q = parseSimpleQuantity(s.text);
    if (q === "no") return null;
    if (last.kind === "dish") last.said = q;
  }
  return items.length > 0 ? items : null;
}

/** La fascia dall'ora locale «HH:MM»: 05:00-10:59 colazione, 11:00-14:59 pranzo, 15:00-18:29 spuntino, 18:30-04:59 cena (BRIEF §4.1). */
export function slotFromTime(localTime: string): MealSlot {
  const [h, m] = localTime.split(":").map(Number);
  const minutes = h * 60 + m;
  if (minutes >= 5 * 60 && minutes < 11 * 60) return "colazione";
  if (minutes >= 11 * 60 && minutes < 15 * 60) return "pranzo";
  if (minutes >= 15 * 60 && minutes < 18 * 60 + 30) return "spuntino";
  return "cena";
}

/**
 * La proposta composta dall'app, senza modello: un solo pasto, nella fascia fissata se c'è, altrimenti dall'ora, con le etichette come riferimenti
 * (gli stessi numeri del testo che andrebbe al modello). La trasformano in piatti le stesse funzioni della proposta del modello.
 */
export function composeLabelOnlyProposal(items: readonly LabelItem[], model: Pick<ModelText, "refs" | "mealRefs">, slot: MealSlot): MealProposal {
  const numberOf = (item: LabelItem): number | null => {
    const map = item.kind === "meal" ? model.mealRefs : model.refs;
    for (const [n, f] of map) if (f.id === item.favoriteId) return n;
    return null;
  };
  const favorites: FavoriteMention[] = [];
  for (const item of items) {
    const ref = numberOf(item);
    if (ref === null) continue;
    const said = item.said;
    favorites.push({
      ref,
      ...(item.kind === "meal" ? { kind: "pasto" as const } : {}),
      quantitySaid: said !== null,
      grams: said?.unit === "g" ? said.amount : null,
      servings: said?.unit === "porzioni" ? said.amount : null,
    });
  }
  return { meals: [{ slot, freeMeal: false, dishes: [], favorites }] };
}

/** Come si risponde a «Stima»: l'app compone la proposta da sola (solo etichette e quantità semplici) oppure la frase va al modello. */
export type EstimateRoute = { via: "app"; proposal: MealProposal; model: ModelText } | { via: "model"; model: ModelText };

/**
 * Decide la strada di «Stima» (BRIEF §4.1). Con sole etichette riconosciute e quantità semplici la proposta è composta qui, nella fascia fissata (che prevale)
 * o altrimenti dall'ora locale; in ogni altro caso la frase, con le etichette come nome e riferimento, va al modello.
 */
export function routeEstimate(
  segments: readonly Segment[],
  favorites: ReadonlyMap<string, FavoriteDish>,
  meals: ReadonlyMap<string, FavoriteMeal>,
  opts: { fixedSlot?: MealSlot; localTime: string },
): EstimateRoute {
  const model = buildModelText(segments, favorites, meals);
  const plan = labelOnlyPlan(segments);
  if (plan && (model.refs.size > 0 || model.mealRefs.size > 0)) {
    return { via: "app", model, proposal: composeLabelOnlyProposal(plan, model, opts.fixedSlot ?? slotFromTime(opts.localTime)) };
  }
  return { via: "model", model };
}
