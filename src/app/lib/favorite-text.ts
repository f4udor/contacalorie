import type { FavoriteDish } from "@/data";

/** Il campo «Cosa hai mangiato?»: pezzi di testo e preferiti inseriti come etichetta (BRIEF §4.1). */
export type Segment = { kind: "text"; text: string } | { kind: "favorite"; favoriteId: string };

/** Il nome di un preferito dentro un'etichetta: senza parentesi quadre, che chiudono l'etichetta. */
const labelName = (name: string): string => name.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim() || "Piatto";

export interface ModelText {
  /** Il testo da mandare al modello: ogni etichetta è «[preferito N: nome]». Nessun numero dei preferiti. */
  text: string;
  /** I preferiti per riferimento (N): è da questi che l'app costruisce i piatti. Lo stesso preferito ha sempre lo stesso numero. */
  refs: Map<number, FavoriteDish>;
}

/**
 * Il testo da mandare al modello. I riferimenti si numerano da 1 nell'ordine in cui compaiono; un'etichetta il cui preferito non è
 * tra quelli noti resta come semplice nome (senza riferimento: il modello non la tratta come preferito).
 */
export function buildModelText(segments: readonly Segment[], favorites: ReadonlyMap<string, FavoriteDish>): ModelText {
  const refs = new Map<number, FavoriteDish>();
  const numberOf = new Map<string, number>();
  const parts = segments.map((s) => {
    // Le parentesi quadre scritte a mano si tolgono: solo le etichette vere possono avere la forma «[preferito N: nome]».
    if (s.kind === "text") return s.text.replace(/[[\]]/g, " ");
    const fav = favorites.get(s.favoriteId);
    if (!fav) return "";
    let n = numberOf.get(fav.id);
    if (n === undefined) {
      n = numberOf.size + 1;
      numberOf.set(fav.id, n);
      refs.set(n, fav);
    }
    return ` [preferito ${n}: ${labelName(fav.name)}] `;
  });
  return { text: parts.join("").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(), refs };
}

/** Il testo letto da una persona (da salvare come testo originale del piatto): le etichette diventano il nome del preferito. */
export function buildDisplayText(segments: readonly Segment[], favorites: ReadonlyMap<string, FavoriteDish>): string {
  return segments
    .map((s) => (s.kind === "text" ? s.text : (favorites.get(s.favoriteId)?.name ?? "")))
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** Nel campo c'è qualcosa da stimare: del testo o almeno un'etichetta. */
export function hasContent(segments: readonly Segment[]): boolean {
  return segments.some((s) => (s.kind === "text" ? s.text.trim() !== "" : true));
}
