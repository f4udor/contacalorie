/** Distanza di trascinamento (px) oltre cui il pannello si chiude comunque. */
export const SHEET_CLOSE_DISTANCE = 120;
/** Distanza minima (px) perché un gesto veloce chiuda il pannello. */
export const SHEET_FLICK_MIN_DISTANCE = 40;
/** Velocità (px/ms) oltre cui il gesto è "veloce". */
export const SHEET_FLICK_SPEED = 0.5;

/** Decide se un trascinamento verso il basso chiude il pannello. */
export function shouldCloseOnDrag(distance: number, durationMs: number): boolean {
  if (distance >= SHEET_CLOSE_DISTANCE) return true;
  if (distance < SHEET_FLICK_MIN_DISTANCE || durationMs <= 0) return false;
  return distance / durationMs >= SHEET_FLICK_SPEED;
}
