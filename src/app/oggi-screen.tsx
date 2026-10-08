"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MealRecord } from "@/data";
import { useDataStore } from "./data-provider";
import { ActivityCard } from "./components/activity-card";
import { ChallengeSection } from "./components/challenge-section";
import { AddPanel, EditActivityPanel, EditMealPanel } from "./components/add-panel";
import { MealList } from "./components/meal-list";
import { Card } from "./components/card";
import { DayHeader } from "./components/day-header";
import { KcalRing } from "./components/kcal-ring";
import { NutrientCard } from "./components/nutrient-card";
import { formatNumber, formatSigned } from "./lib/format";
import { DEFAULT_CHALLENGE_PLAN } from "@/engine";
import { buildChallengeView } from "./lib/challenge-view";
import { currentWeight, buildTodayView } from "./lib/today-view";
import { useToday } from "./lib/use-today";
import { useWeekData } from "./lib/use-week-data";

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/** Schermata Oggi (parte alta: data, anello, composizione dell'obiettivo, nutrienti). */
export function OggiScreen() {
  const today = useToday();
  const param = useSearchParams().get("d");
  const date = param && DATE_PARAM.test(param) ? param : today;
  const { data, reload } = useWeekData(date);
  const store = useDataStore();
  const [panel, setPanel] = useState<{ kind: "add" } | { kind: "edit"; meal: MealRecord } | { kind: "activity" } | null>(null);

  if (!today || !date) return <main aria-busy="true" />;

  const view = data
    ? buildTodayView({
        date,
        days: data.days,
        settings: data.settings,
        weightKg: currentWeight(data.weighIns, date, data.userSettings.weightKg),
      })
    : null;

  const meals = data?.meals.filter((m) => m.date === date) ?? [];
  const activity = data?.activity.find((a) => a.date === date) ?? null;
  const weighIn = data?.weighIns.find((w) => w.date === date) ?? null;
  const panelContext =
    data && store
      ? { store, date, days: data.days, settings: data.settings, activity, weightKg: weighIn?.weightKg ?? null, onChanged: reload, onClose: () => setPanel(null) }
      : null;

  const challenge = data
    ? buildChallengeView({ plan: DEFAULT_CHALLENGE_PLAN, startDate: data.userSettings.challengeStartDate, date, log: data.challengeLog })
    : null;

  return (
    <main className="pb-24">
      <DayHeader date={date} today={today} />
      {view && (
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col items-center pb-5 pt-6">
            <KcalRing remaining={view.remaining} progress={view.ringProgress} color={view.ringColor} eaten={view.eaten} target={view.target} empty={!view.hasMeals} />
            <p className="mt-4 text-center text-sm text-muted" aria-label="Composizione dell'obiettivo">
              {view.composition
                .map((c) => `${c.label} ${c.signed ? formatSigned(c.amount) : formatNumber(c.amount)}`)
                .join(" · ")}
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {view.nutrients.map((n, i) => (
              <NutrientCard key={n.key} n={n} wide={i === view.nutrients.length - 1 && view.nutrients.length % 2 === 1} />
            ))}
          </div>
          {meals.length > 0 ? (
            <MealList meals={meals} onSelect={(meal) => setPanel({ kind: "edit", meal })} />
          ) : (
            <Card>
              <p className="text-center text-[15px] text-muted">Nessun pasto per questo giorno. Tocca + per aggiungerne uno.</p>
            </Card>
          )}
          <ActivityCard activity={activity} settings={data!.settings} onEdit={() => setPanel({ kind: "activity" })} />
          {challenge && store && <ChallengeSection view={challenge} date={date} store={store} onChanged={reload} />}
        </div>
      )}
      <button
        type="button"
        aria-label="Aggiungi"
        onClick={() => setPanel({ kind: "add" })}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc((100vw-36rem)/2+1rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {panelContext && panel?.kind === "add" && <AddPanel {...panelContext} />}
      {panelContext && panel?.kind === "activity" && <EditActivityPanel {...panelContext} />}
      {panelContext && panel?.kind === "edit" && <EditMealPanel {...panelContext} meal={panel.meal} />}
    </main>
  );
}
