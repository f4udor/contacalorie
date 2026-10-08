import { kcalBudget } from "./budget";
import { weekDates } from "./dates";
import { targetFromBalance } from "./target";
import type { DayTarget, TargetSettings } from "./target";
import type { DateKey, Day } from "./types";

/**
 * Anteprima dell'obiettivo di un giorno successivo a `today` (§3.3).
 * I giorni tra oggi e quel giorno senza pasti contano come se si mangiasse esattamente il loro obiettivo;
 * oggi conta con le kcal reali se sono sopra l'obiettivo, altrimenti come se lo si raggiungesse.
 * Per un giorno non successivo a oggi vale l'obiettivo normale. `today` è un parametro: il motore non legge la data.
 */
export function previewDayTarget(date: DateKey, today: DateKey, weekDays: readonly Day[], settings: TargetSettings): DayTarget {
  let balance = 0;
  const known = (d: DateKey): Day => weekDays.find((k) => k.date === d) ?? { date: d, meals: [], activity: { steps: null, bikeKm: null, bikeKcalHealth: null } };
  for (const d of weekDates(date)) {
    if (d >= date) break;
    const day = known(d);
    const hasMeals = day.meals.length > 0;
    if (d < today && !hasMeals) continue; // giorno passato senza pasti: non entra nel saldo
    const target = targetFromBalance(d, balance, day, settings);
    // Kcal che si contano per il giorno: quelle reali, oppure l'obiettivo se è ancora da vivere.
    const eaten = d === today ? Math.max(kcalBudget(day.meals, settings), target.total) : hasMeals ? kcalBudget(day.meals, settings) : target.total;
    const delta = settings.baseKcal + target.bikeBonus + target.stepsBonus - eaten;
    balance = Math.min(balance + delta, settings.creditCap);
  }
  return targetFromBalance(date, balance, known(date), settings);
}
