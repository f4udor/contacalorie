"use client";

import { groupMeals, mealBudgetKcal, MEAL_SLOTS } from "@/engine";
import type { MealSlot, Settings } from "@/engine";
import type { MealRecord } from "@/data";
import { formatNumber } from "../lib/format";
import { SLOTS } from "../lib/meal-form";
import { SwipeRow, trashIcon, useOpenRow } from "./swipe-row";
import { Num } from "./ui/ui";

const LABEL: Record<MealSlot, string> = Object.fromEntries(SLOTS.map((s) => [s.value, s.label])) as Record<MealSlot, string>;

interface MealListProps {
  /** I piatti del giorno. */
  dishes: readonly MealRecord[];
  settings: Pick<Settings, "freeMealCap">;
  onSelectDish: (dish: MealRecord) => void;
  onAddDish: (slot: MealSlot) => void;
  /** Tocco sull'intestazione di un pasto: salvarlo nei preferiti. */
  onSaveMeal: (slot: MealSlot) => void;
  /** Il piatto è già tra i preferiti: compare «Rimuovi dai preferiti» al posto di «Preferiti». */
  isFavorite: (dish: MealRecord) => boolean;
  /** Scorrendo un piatto a sinistra: salvarlo nei preferiti o toglierlo. */
  onFavoriteDish: (dish: MealRecord) => void;
  /** Scorrendo un piatto a sinistra: eliminarlo subito, senza conferma. */
  onDeleteDish: (dish: MealRecord) => void;
}

/** I pasti del giorno: una scheda per fascia, con totali, piatti elencati e "Aggiungi piatto". */
export function MealList({ dishes, settings, onSelectDish, onAddDish, onSaveMeal, isFavorite, onFavoriteDish, onDeleteDish }: MealListProps) {
  const rows = useOpenRow();
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const groups = groupMeals(dishes);
  const empty = MEAL_SLOTS.filter((slot) => !groups.some((g) => g.slot === slot));

  return (
    <section aria-label="Pasti del giorno" className="flex flex-col gap-3">
      {groups.map((g) => {
        const counted = mealBudgetKcal(g, settings);
        return (
          <article key={g.slot} aria-label={LABEL[g.slot]} className="rounded-scheda bg-scheda p-4">
            <header>
              <button type="button" onClick={() => onSaveMeal(g.slot)} aria-label={`${LABEL[g.slot]}: salva il pasto nei preferiti`} className="block w-full text-left">
                <span className="flex items-center justify-between gap-3">
                  <span role="heading" aria-level={2} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] font-semibold">
                    {LABEL[g.slot]}
                    {g.isFree && <span className="rounded-full bg-tessera px-2 py-0.5 text-[12px] font-semibold text-testo-secondario">Pasto libero</span>}
                  </span>
                  <Num value={formatNumber(g.kcal)} unit="kcal" size="sm" />
                </span>
                <span className="mt-0.5 block text-[13px] tabular-nums text-testo-secondario">
                  P {formatNumber(g.protein)} · C {formatNumber(g.carbs)} · G {formatNumber(g.fat)}
                  {g.isFree && counted < g.kcal && ` · contate ${formatNumber(counted)} kcal`}
                </span>
              </button>
            </header>
            <ul className="mt-3 flex flex-col gap-2">
              {g.dishes.map((d) => {
                const dish = byId.get(d.id) ?? (d as MealRecord);
                return (
                  <li key={d.id}>
                    <SwipeRow
                      id={d.id}
                      openId={rows.openId}
                      setOpen={rows.setOpen}
                      className="rounded-tessera"
                      actions={[
                        isFavorite(dish)
                          ? { key: "preferiti", label: "Rimuovi dai preferiti", tone: "accent", width: 112, onClick: () => onFavoriteDish(dish) }
                          : { key: "preferiti", label: "Salva nei preferiti", tone: "accent", width: 112, onClick: () => onFavoriteDish(dish) },
                        { key: "elimina", label: `Elimina ${d.name}`, icon: trashIcon, tone: "danger", onClick: () => onDeleteDish(dish) },
                      ]}
                    >
                      <button type="button" onClick={() => onSelectDish(dish)} className="flex min-h-12 w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left">
                        <span className="min-w-0">
                          <span className="block break-words text-[16px] leading-snug">{d.name}</span>
                          {dish.quantity && <span className="line-clamp-2 break-words text-[13px] text-testo-secondario">{dish.quantity}</span>}
                        </span>
                        <span className="shrink-0 pt-px font-cifre text-[17px] tabular-nums">{formatNumber(d.kcal)}</span>
                      </button>
                    </SwipeRow>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => onAddDish(g.slot)} className="mt-1 flex min-h-11 w-full items-center px-1 text-[15px] font-semibold text-comando">
              + Aggiungi piatto
            </button>
          </article>
        );
      })}
      {groups.length === 0 && <p className="rounded-scheda bg-scheda px-4 py-4 text-center text-[15px] text-testo-secondario">Nessun pasto. Tocca + per aggiungerne uno.</p>}
      {empty.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Aggiungi un pasto">
          {empty.map((slot) => (
            <button key={slot} type="button" onClick={() => onAddDish(slot)} className="min-h-11 rounded-full bg-scheda px-4 text-[15px] font-semibold text-comando">
              + {LABEL[slot]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
