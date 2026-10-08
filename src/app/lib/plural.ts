import { formatNumber } from "./format";

/** "1 giorno", "3 giorni". */
export function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
