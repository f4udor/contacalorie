"use client";

import { groupMeals, mealBudgetKcal, MEAL_SLOTS } from "@/engine";
import type { MealSlot, Settings } from "@/engine";
import type { MealRecord } from "@/data";
import { formatNumber } from "../lib/format";
import { SLOTS } from "../lib/meal-form";
import { SwipeRow, trashIcon, useOpenRow } from "./swipe-row";

const LABEL: Record<MealSlot, string> = Object.fromEntries(SLOTS.map((s) => [s.value, s.label])) as Record<MealSlot, string>;

interface MealListProps {
  /** I piatti del giorno. */
  dishes: readonly MealRecord[];
  settings: Pick<Settings, "freeMealCap">;
  onSelectDish: (dish: MealRecord) => void;
  onAddDish: (slot: MealSlot) => void;
  /** Tocco sull'intestazione di un pasto: salvarlo nei preferiti. */
  onSaveMeal: (slot: MealSlot) => void;
  /** Scorrendo un piatto a sinistra: salvarlo nei preferiti. */
  onFavoriteDish: (dish: MealRecord) => void;
  /** Scorrendo un piatto a sinistra: eliminarlo subito, senza conferma. */
  onDeleteDish: (dish: MealRecord) => void;
}

/** I pasti del giorno: una scheda per fascia, con totali, piatti elencati e "Aggiungi piatto". */
export function MealList({ dishes, settings, onSelectDish, onAddDish, onSaveMeal, onFavoriteDish, onDeleteDish }: MealListProps) {
  const rows = useOpenRow();
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const groups = groupMeals(dishes);
  const empty = MEAL_SLOTS.filter((slot) => !groups.some((g) => g.slot === slot));

  return (
    <section aria-label="Pasti del giorno" className="flex flex-col gap-3">
      {groups.map((g) => {
        const counted = mealBudgetKcal(g, settings);
        return (
          <article key={g.slot} aria-label={LABEL[g.slot]} className="overflow-hidden rounded-2xl bg-card">
            <header>
              <button type="button" onClick={() => onSaveMeal(g.slot)} aria-label={`${LABEL[g.slot]}: salva il pasto nei preferiti`} className="block w-full px-4 pb-2 pt-3 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span role="heading" aria-level={2} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] font-bold">
                    {LABEL[g.slot]}
                    {g.isFree && <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-accent">libero</span>}
                  </span>
                  <span className="shrink-0 text-[17px] font-bold tabular-nums">
                    {formatNumber(g.kcal)} <span className="text-sm font-medium text-muted">kcal</span>
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted tabular-nums">
                  P {formatNumber(g.protein)} · C {formatNumber(g.carbs)} · G {formatNumber(g.fat)}
                  {g.isFree && counted < g.kcal && ` · nel budget ${formatNumber(counted)} kcal`}
                </span>
              </button>
            </header>
            <ul>
              {g.dishes.map((d) => {
                const dish = byId.get(d.id) ?? (d as MealRecord);
                return (
                  <li key={d.id} className="border-t border-line">
                    <SwipeRow
                      id={d.id}
                      openId={rows.openId}
                      setOpen={rows.setOpen}
                      actions={[
                        { key: "preferiti", label: "Preferiti", tone: "accent", onClick: () => onFavoriteDish(dish) },
                        { key: "elimina", label: `Elimina ${d.name}`, icon: trashIcon, tone: "danger", onClick: () => onDeleteDish(dish) },
                      ]}
                    >
                      <button type="button" onClick={() => onSelectDish(dish)} className="flex min-h-12 w-full items-start justify-between gap-3 px-4 py-2.5 text-left">
                        <span className="min-w-0">
                          <span className="block break-words text-[16px] leading-snug">{d.name}</span>
                          {dish.quantity && <span className="block break-words text-sm text-muted">{dish.quantity}</span>}
                        </span>
                        <span className="shrink-0 pt-px text-[16px] tabular-nums text-muted">{formatNumber(d.kcal)} kcal</span>
                      </button>
                    </SwipeRow>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => onAddDish(g.slot)} className="flex min-h-11 w-full items-center border-t border-line px-4 text-[15px] font-semibold text-accent">
              + Aggiungi piatto
            </button>
          </article>
        );
      })}
      {groups.length === 0 && (
        <p className="rounded-2xl bg-card px-4 py-4 text-center text-[15px] text-muted">Nessun pasto per questo giorno. Scegli una fascia o tocca +.</p>
      )}
      {empty.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1" aria-label="Aggiungi un pasto">
          <span className="text-sm text-muted">{groups.length === 0 ? "Aggiungi:" : "Anche:"}</span>
          {empty.map((slot) => (
            <button key={slot} type="button" onClick={() => onAddDish(slot)} className="min-h-11 rounded-full bg-card px-4 text-[15px] font-semibold text-accent">
              + {LABEL[slot]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
