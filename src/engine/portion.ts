/** Numeri di un piatto che si ricalcolano in proporzione alla quantità (BRIEF §4.1). */
export interface ScalableNumbers {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

/**
 * Arrotonda a `decimals` decimali con il «mezzo in su» sul valore scritto in decimale: 19,95 → 20,0 anche se in binario
 * 19,95 vale 19,9499… (con `Math.round(x * 10) / 10` darebbe 19,9).
 */
export function roundHalfUp(n: number, decimals: number): number {
  // Numeri scritti in notazione esponenziale (molto piccoli o molto grandi): niente trucco sul testo.
  if (String(n).includes("e")) return Math.round(n * 10 ** decimals) / 10 ** decimals;
  return Number(`${Math.round(Number(`${n}e${decimals}`))}e-${decimals}`);
}

/** Rapporto tra un peso nuovo e un peso di partenza (grammi); null se uno dei due non è un numero positivo. */
export function weightRatio(baseWeightG: number, newWeightG: number): number | null {
  if (!(baseWeightG > 0) || !(newWeightG > 0) || !Number.isFinite(baseWeightG) || !Number.isFinite(newWeightG)) return null;
  return newWeightG / baseWeightG;
}

/**
 * BRIEF §4.1: kcal e nutrienti di un piatto in proporzione al rapporto `ratio`: kcal arrotondate all'intero, nutrienti a un decimale.
 * Con rapporto 1 i valori restano quelli di partenza (nessun arrotondamento); un rapporto non positivo non è valido (null).
 */
export function scaleNutrients(base: ScalableNumbers, ratio: number): ScalableNumbers | null {
  if (!(ratio > 0) || !Number.isFinite(ratio)) return null;
  if (ratio === 1) return { ...base };
  return {
    kcal: roundHalfUp(base.kcal * ratio, 0),
    protein: roundHalfUp(base.protein * ratio, 1),
    carbs: roundHalfUp(base.carbs * ratio, 1),
    fat: roundHalfUp(base.fat * ratio, 1),
    fiber: roundHalfUp(base.fiber * ratio, 1),
    salt: roundHalfUp(base.salt * ratio, 1),
  };
}

/** Un preferito da cui costruire un piatto (§4.1): peso e numeri del piatto salvato. */
export interface FavoriteSource extends ScalableNumbers {
  /** Peso in grammi del piatto salvato; null se non noto (il preferito funziona a porzioni). */
  weightG: number | null;
  /** Quantità scritta nel piatto salvato (per esempio «150 g»), se c'è. */
  quantity: string | null;
}

/** La quantità detta dall'utente per un'etichetta: grammi o porzioni; null se non l'ha detta. */
export type SaidQuantity = { unit: "g"; amount: number } | { unit: "porzioni"; amount: number } | null;

/** Avviso quando si dicono i grammi di un preferito che non ha il peso (§4.1). */
export const UNKNOWN_WEIGHT_WARNING = "Peso del preferito sconosciuto: contata una porzione";

export interface FavoriteDishResult {
  /** Rapporto applicato ai numeri del preferito. */
  ratio: number;
  numbers: ScalableNumbers;
  /** Peso del piatto in grammi (intero); null se il preferito non ha peso o non si può dedurre. */
  weightG: number | null;
  /** La quantità scritta nel piatto: «100 g», «2 porzioni», «1 porzione». */
  quantityText: string;
  /** Vero se la quantità non è stata detta (o non è stato possibile usarla): è ipotizzata. */
  assumed: boolean;
  warning: string | null;
}

/** «1,5» per 1.5, «2» per 2: come si scrivono i numeri delle quantità. */
const asText = (n: number): string => String(n).replace(".", ",");

/**
 * BRIEF §4.1, calcolo (lo fa l'app, mai il modello). Con `r` = rapporto:
 * - peso del preferito e grammi detti: `r = grammi / peso`, peso del piatto = grammi detti, quantità «150 g»;
 * - porzioni dette: `r = porzioni`, peso = peso del preferito × porzioni (se c'è), quantità «2 porzioni»;
 * - nessuna quantità: `r = 1`, quantità ipotizzata (quella salvata nel preferito, altrimenti «1 porzione»), peso del preferito;
 * - preferito senza peso e grammi detti: `r = 1` con l'avviso `UNKNOWN_WEIGHT_WARNING`, quantità «1 porzione» ipotizzata.
 * Kcal arrotondate all'intero, nutrienti a un decimale. Quantità dette non positive valgono come non dette.
 */
export function favoriteDishFromQuantity(favorite: FavoriteSource, said: SaidQuantity): FavoriteDishResult {
  const base: ScalableNumbers = { kcal: favorite.kcal, protein: favorite.protein, carbs: favorite.carbs, fat: favorite.fat, fiber: favorite.fiber, salt: favorite.salt };
  const usable = said !== null && said.amount > 0 && Number.isFinite(said.amount) ? said : null;
  const numbersFor = (ratio: number): ScalableNumbers => scaleNutrients(base, ratio) ?? base;
  const hasWeight = favorite.weightG !== null && favorite.weightG > 0;
  if (usable?.unit === "g") {
    if (hasWeight) {
      const grams = Math.round(usable.amount);
      const ratio = usable.amount / (favorite.weightG as number);
      return { ratio, numbers: numbersFor(ratio), weightG: grams > 0 ? grams : null, quantityText: `${asText(usable.amount)} g`, assumed: false, warning: null };
    }
    return { ratio: 1, numbers: numbersFor(1), weightG: null, quantityText: "1 porzione", assumed: true, warning: UNKNOWN_WEIGHT_WARNING };
  }
  if (usable?.unit === "porzioni") {
    const ratio = usable.amount;
    return {
      ratio,
      numbers: numbersFor(ratio),
      weightG: hasWeight ? Math.round((favorite.weightG as number) * ratio) : null,
      quantityText: `${asText(ratio)} ${ratio === 1 ? "porzione" : "porzioni"}`,
      assumed: false,
      warning: null,
    };
  }
  return { ratio: 1, numbers: numbersFor(1), weightG: hasWeight ? (favorite.weightG as number) : null, quantityText: favorite.quantity?.trim() || "1 porzione", assumed: true, warning: null };
}
