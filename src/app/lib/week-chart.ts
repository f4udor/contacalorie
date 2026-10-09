/** Geometria dei grafici della Settimana (BRIEF §10.5), in coordinate 0-100 (x da sinistra, y dall'alto). */

/** L'altezza di una barra o di una linea come y: 0 = in basso → y 100; 1 = in alto → y 0. */
export const ratioToY = (ratio: number): number => Math.round((100 - Math.min(Math.max(ratio, 0), 1) * 100) * 100) / 100;

/**
 * La linea dell'obiettivo: continua da lunedì a domenica, a gradini dove l'obiettivo cambia da un giorno all'altro.
 * `ratios` ha un valore per giorno (0-1, sulla stessa scala delle barre); ogni giorno occupa una settima parte della larghezza.
 */
export function stepPath(ratios: readonly number[]): string {
  const n = ratios.length;
  if (n === 0) return "";
  const w = 100 / n;
  const x = (i: number) => Math.round(i * w * 100) / 100;
  let y = ratioToY(ratios[0]);
  let d = `M${x(0)},${y}`;
  ratios.forEach((r, i) => {
    const next = ratioToY(r);
    if (i > 0 && next !== y) d += ` V${next}`;
    y = next;
    d += ` H${x(i + 1)}`;
  });
  return d;
}

/** Le linee della griglia orizzontale puntinata (come y), dall'alto: tre linee a un quarto, metà e tre quarti della scala. */
export const GRID_Y: readonly number[] = [25, 50, 75];

/**
 * Altezze (0-1) dei sette giorni dei mini grafici di passi e bici: la scala è il massimo della settimana, quindi la barra più alta
 * arriva in cima. Un giorno senza valore (o a zero) non ha barra; una settimana senza dati ha tutte le barre a zero (griglia vuota).
 */
export function miniBarRatios(values: readonly (number | null)[]): number[] {
  const max = Math.max(0, ...values.map((v) => v ?? 0));
  return values.map((v) => (max > 0 && v !== null && v > 0 ? v / max : 0));
}

/** La settimana ha almeno un valore da mostrare nel mini grafico. */
export const hasAnyValue = (values: readonly (number | null)[]): boolean => values.some((v) => v !== null && v > 0);
