"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "./components/card";
import { DayHeader } from "./components/day-header";
import { KcalRing } from "./components/kcal-ring";
import { NutrientCard } from "./components/nutrient-card";
import { formatNumber, formatSigned } from "./lib/format";
import { currentWeight, buildTodayView } from "./lib/today-view";
import { useToday } from "./lib/use-today";
import { useWeekData } from "./lib/use-week-data";

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/** Schermata Oggi (parte alta: data, anello, composizione dell'obiettivo, nutrienti). */
export function OggiScreen() {
  const today = useToday();
  const param = useSearchParams().get("d");
  const date = param && DATE_PARAM.test(param) ? param : today;
  const { data } = useWeekData(date);

  if (!today || !date) return <main aria-busy="true" />;

  const view = data
    ? buildTodayView({
        date,
        days: data.days,
        settings: data.settings,
        weightKg: currentWeight(data.weighIns, date, data.userSettings.weightKg),
      })
    : null;

  return (
    <main>
      <DayHeader date={date} today={today} />
      {view && (
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col items-center pb-5 pt-6">
            <KcalRing remaining={view.remaining} progress={view.ringProgress} color={view.ringColor} eaten={view.eaten} target={view.target} />
            <p className="mt-4 text-center text-sm text-muted" aria-label="Composizione dell'obiettivo">
              {view.composition
                .map((c) => `${c.label} ${c.signed ? formatSigned(c.amount) : formatNumber(c.amount)}`)
                .join(" · ")}
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {view.nutrients.map((n) => (
              <NutrientCard key={n.key} n={n} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
