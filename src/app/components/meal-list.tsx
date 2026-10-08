import type { MealSlot } from "@/engine";
import type { MealRecord } from "@/data";
import { formatNumber } from "../lib/format";
import { SLOTS } from "../lib/meal-form";

/** Pasti del giorno raggruppati per fascia. Toccando un pasto si apre la modifica. */
export function MealList({ meals, onSelect }: { meals: readonly MealRecord[]; onSelect: (meal: MealRecord) => void }) {
  const bySlot = (slot: MealSlot) => meals.filter((m) => m.slot === slot);
  return (
    <section aria-label="Pasti del giorno" className="flex flex-col gap-3">
      {SLOTS.map(({ value, label }) => {
        const list = bySlot(value);
        if (list.length === 0) return null;
        return (
          <div key={value}>
            <h2 className="px-1 pb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">{label}</h2>
            <ul className="overflow-hidden rounded-2xl bg-card">
              {list.map((m, i) => (
                <li key={m.id} className={i > 0 ? "border-t border-line" : ""}>
                  <button type="button" onClick={() => onSelect(m)} className="flex min-h-14 w-full items-start justify-between gap-3 px-4 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block break-words text-[17px] font-semibold leading-snug">{m.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted tabular-nums">
                        <span>
                          P {formatNumber(m.protein)} · C {formatNumber(m.carbs)} · G {formatNumber(m.fat)}
                        </span>
                        {m.isFree && <span className="rounded-full bg-track px-2 py-0.5 text-xs font-semibold text-accent">libero</span>}
                      </span>
                    </span>
                    <span className="shrink-0 pt-px text-[17px] font-semibold tabular-nums">
                      {formatNumber(m.kcal)} <span className="text-sm font-medium text-muted">kcal</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
