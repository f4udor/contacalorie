import type { FavoriteDish, FavoriteMeal } from "@/data";

/** Il campo «Cosa hai mangiato?»: pezzi di testo e preferiti inseriti come etichetta (BRIEF §4.1). */
export type Segment = { kind: "text"; text: string } | { kind: "favorite"; favoriteId: string; /** «meal» per un pasto preferito (etichetta con il bordo nel colore Comando); assente = piatto. */ favoriteKind?: "meal" };

/** Un preferito scelto dall'elenco: un piatto o un pasto intero. */
export type PickedFavorite = { kind: "dish"; favorite: FavoriteDish } | { kind: "meal"; favorite: FavoriteMeal };

/** Il nome di un preferito dentro un'etichetta: senza parentesi quadre, che chiudono l'etichetta. */
const labelName = (name: string): string => name.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim() || "Piatto";

export interface ModelText {
  /** Il testo da mandare al modello: ogni etichetta è «[preferito N: nome]» (un pasto: «[pasto preferito N: nome]»). Nessun numero dei preferiti. */
  text: string;
  /** I piatti preferiti per riferimento (N): è da questi che l'app costruisce i piatti. Lo stesso preferito ha sempre lo stesso numero. */
  refs: Map<number, FavoriteDish>;
  /** I pasti preferiti per riferimento (N); i numeri sono gli stessi spazi dei piatti, senza sovrapposizioni. */
  mealRefs: Map<number, FavoriteMeal>;
}

/**
 * Il testo da mandare al modello. I riferimenti si numerano da 1 nell'ordine in cui compaiono; un'etichetta il cui preferito non è
 * tra quelli noti resta come semplice nome (senza riferimento: il modello non la tratta come preferito).
 */
export function buildModelText(segments: readonly Segment[], favorites: ReadonlyMap<string, FavoriteDish>, meals: ReadonlyMap<string, FavoriteMeal> = new Map()): ModelText {
  const refs = new Map<number, FavoriteDish>();
  const mealRefs = new Map<number, FavoriteMeal>();
  const dishNumber = new Map<string, number>();
  const mealNumber = new Map<string, number>();
  let next = 0;
  const parts = segments.map((s) => {
    // Le parentesi quadre scritte a mano si tolgono: solo le etichette vere possono avere la forma «[preferito N: nome]».
    if (s.kind === "text") return s.text.replace(/[[\]]/g, " ");
    if (s.favoriteKind === "meal") {
      const meal = meals.get(s.favoriteId);
      if (!meal) return "";
      let n = mealNumber.get(meal.id);
      if (n === undefined) {
        n = ++next;
        mealNumber.set(meal.id, n);
        mealRefs.set(n, meal);
      }
      return ` [pasto preferito ${n}: ${labelName(meal.name)}] `;
    }
    const fav = favorites.get(s.favoriteId);
    if (!fav) return "";
    let n = dishNumber.get(fav.id);
    if (n === undefined) {
      n = ++next;
      dishNumber.set(fav.id, n);
      refs.set(n, fav);
    }
    return ` [preferito ${n}: ${labelName(fav.name)}] `;
  });
  return { text: parts.join("").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(), refs, mealRefs };
}

/** Il testo letto da una persona (da salvare come testo originale del piatto): le etichette diventano il nome del preferito. */
export function buildDisplayText(segments: readonly Segment[], favorites: ReadonlyMap<string, FavoriteDish>, meals: ReadonlyMap<string, FavoriteMeal> = new Map()): string {
  return segments
    .map((s) => (s.kind === "text" ? s.text : ((s.favoriteKind === "meal" ? meals.get(s.favoriteId) : favorites.get(s.favoriteId))?.name ?? "")))
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** Nel campo c'è qualcosa da stimare: del testo o almeno un'etichetta. */
export function hasContent(segments: readonly Segment[]): boolean {
  return segments.some((s) => (s.kind === "text" ? s.text.trim() !== "" : true));
}
