/** Movimento (px) oltre cui si decide se il gesto è orizzontale o verticale. */
export const SWIPE_LOCK_PX = 8;
/** Frazione della larghezza dei pulsanti oltre cui la riga resta aperta al rilascio. */
export const SWIPE_OPEN_FRACTION = 0.4;
/** Larghezza (px) di un pulsante con testo e di uno con la sola icona: almeno 44 px. */
export const SWIPE_ACTION_WIDTH = 84;
export const SWIPE_ICON_ACTION_WIDTH = 64;

export type SwipeDirection = "pending" | "horizontal" | "vertical";

/**
 * Dal movimento dall'inizio del gesto: finché è piccolo non si sa; poi è orizzontale solo se il movimento
 * è più orizzontale che verticale (altrimenti è lo scorrimento della pagina e il gesto non parte).
 */
export function swipeDirection(dx: number, dy: number): SwipeDirection {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < SWIPE_LOCK_PX) return "pending";
  return ax > ay ? "horizontal" : "vertical";
}

/** Posizione della riga durante il trascinamento: solo verso sinistra (da 0 a −larghezza dei pulsanti). Verso destra non si va oltre 0. */
export function swipeOffset(startOffset: number, dx: number, actionsWidth: number): number {
  return Math.min(0, Math.max(-actionsWidth, startOffset + dx));
}

/** Al rilascio la riga resta aperta se è stata tirata oltre una frazione della larghezza dei pulsanti. */
export function shouldStayOpen(offset: number, actionsWidth: number): boolean {
  return actionsWidth > 0 && -offset >= actionsWidth * SWIPE_OPEN_FRACTION;
}

/** Quale riga è aperta dopo una richiesta: ce n'è al massimo una (aprirne una chiude le altre). */
export function nextOpenRow(current: string | null, id: string, open: boolean): string | null {
  if (open) return id;
  return current === id ? null : current;
}
