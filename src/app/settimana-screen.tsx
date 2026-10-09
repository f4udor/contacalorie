"use client";

import { useSearchParams } from "next/navigation";
import { addDays, bikeKmTotal, weekStart } from "@/engine";
import type { DateKey } from "@/engine";
import { useState } from "react";
import { Card, Num } from "./components/ui/ui";
import { ActivityWeekPanel, FreeMealPanel, WeightPanel } from "./components/week-panels";
import { useDataStore } from "./data-provider";
import { MiniBars, WeekChart } from "./components/week-chart";
import { formatDayMonthShort, formatKg, formatNumber, formatSigned, formatWeightDelta } from "./lib/format";
import { weekNav } from "./lib/nav";
import type { SectionId } from "./lib/settings-sections";
import { ScreenHeader } from "./components/screen-header";
import { SettingsPanel } from "./components/settings-view";
import { useToday } from "./lib/use-today";
import { useWeekData } from "./lib/use-week-data";
import { buildWeekView } from "./lib/week-view";
import { weekWeight, weightCard } from "./lib/week-weight";
import { hasAnyValue } from "./lib/week-chart";

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

const dash = "–";

/** Schermata Settimana (lunedì-domenica). */
export function SettimanaScreen() {
  const today = useToday();
  const param = useSearchParams().get("w");
  const anchor = param && DATE_PARAM.test(param) ? param : today;
  const monday: DateKey | null = anchor ? weekStart(anchor) : null;
  const { data, reload } = useWeekData(monday);
  const store = useDataStore();
  const [panel, setPanel] = useState<"peso" | "bici" | "passi" | "libero" | null>(null);
  // Pannello delle Impostazioni (aperto dall'ingranaggio): `null` = chiuso, altrimenti la pagina aperta (`section: null` = l'elenco).
  const [settings, setSettings] = useState<{ section: SectionId | null } | null>(null);

  if (!today || !monday) return <main aria-busy="true" />;

  const sunday = addDays(monday, 6);
  const view = data ? buildWeekView({ date: monday, days: data.days, settings: data.settings, today }) : null;
  const s = view?.summary;
  const weight = data ? weekWeight({ monday, sunday, weighIns: data.weighIns, profileWeightKg: data.userSettings.weightKg, targetWeightKg: data.userSettings.targetWeightKg }) : null;
  const card = weightCard(weight, formatKg, formatWeightDelta);
  const stepValues = data ? data.days.map((d) => d.activity.steps) : [];
  const kmValues = data ? data.days.map((d) => bikeKmTotal(d.activity)) : [];
  const sub = "mt-1 text-[13px] text-testo-secondario";

  return (
    <main>
      <ScreenHeader
        kicker={`${formatDayMonthShort(monday)} – ${formatDayMonthShort(sunday)}`}
        title="Settimana"
        nav={weekNav(monday, today)}
        prevLabel="Settimana precedente"
        nextLabel="Settimana successiva"
        nowLabel="Torna a questa settimana"
        onSettings={() => setSettings({ section: null })}
      />
      <div className="pt-3" />

      {view && s && (
        <div className="flex flex-col gap-3">
          <WeekChart bars={view.bars} today={today} avg={s.avgKcal === null || view.avgRatio === null ? null : { kcal: s.avgKcal, ratio: view.avgRatio }} />

          {view.isEmpty && !weight && (
            <Card>
              <p className="text-center text-[15px] text-testo-secondario">Nessun dato in questa settimana.</p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card title="Saldo">
              <div className="mt-3">
                {s.balance === null ? <Num value={dash} size="lg" tone="testo-secondario" /> : <Num value={formatSigned(s.balance)} unit="kcal" size="md" tone={s.balance > 0 ? "in-obiettivo" : "testo"} />}
              </div>
              {s.balance !== null && <p className={sub}>{s.balance < 0 ? "da recuperare" : "di margine"}</p>}
            </Card>
            <Card title="Media">
              <div className="mt-3">{s.avgKcal === null ? <Num value={dash} size="md" tone="testo-secondario" /> : <Num value={formatNumber(s.avgKcal)} unit="kcal" size="md" />}</div>
              <p className={sub}>sui giorni conclusi</p>
            </Card>
            <Card title="Passi" onOpen={() => setPanel("passi")} openLabel="Apri Passi">
              <p className={sub}>Media</p>
              <div className="mt-1">{s.avgSteps === null ? <Num value={dash} size="lg" tone="testo-secondario" /> : <Num value={formatNumber(s.avgSteps)} size="lg" tone="passi" />}</div>
              <div className="mt-3">
                <MiniBars values={stepValues} tone="passi" />
              </div>
            </Card>
            <Card title="Bici" onOpen={() => setPanel("bici")} openLabel="Apri Bici">
              <p className={sub}>Questa settimana</p>
              <div className="mt-1">{s.totalKm === null ? <Num value={dash} size="lg" tone="testo-secondario" /> : <Num value={formatNumber(s.totalKm, 1)} unit="km" size="lg" tone="bici" />}</div>
              <div className="mt-3">
                <MiniBars values={kmValues} tone="bici" />
              </div>
              {!hasAnyValue(kmValues) && <span className="sr-only">Nessuna uscita</span>}
            </Card>
            <Card title="Peso" onOpen={() => setPanel("peso")} openLabel="Apri Peso">
              <div className="mt-3">{weight ? <Num value={formatKg(weight.lastKg)} unit="kg" size="md" /> : <span className="text-[17px] text-testo-secondario">{card.value}</span>}</div>
              {card.hint && weight && weight.deltaKg !== null && (
                <p className={`mt-1 text-[13px] font-medium ${weight.tone === "ok" ? "text-in-obiettivo" : weight.tone === "bad" ? "text-fuori" : "text-testo-secondario"}`}>{card.hint}</p>
              )}
            </Card>
            <Card title="Pasto libero" onOpen={() => setPanel("libero")} openLabel="Apri Pasto libero">
              <div className="mt-3">
                <span className="font-cifre text-[22px] font-medium leading-none">{s.freeMealUsed ? "Usato" : "Non usato"}</span>
              </div>
              <p className={sub}>1 a settimana</p>
            </Card>
          </div>

          <Card title="Medie dei nutrienti">
            <dl className="mt-2 divide-y divide-separatore">
              {(
                [
                  ["Proteine", "protein", 0],
                  ["Carboidrati", "carbs", 0],
                  ["Grassi", "fat", 0],
                  ["Fibre", "fiber", 0],
                  ["Sale", "salt", 1],
                ] as const
              ).map(([name, key, decimals]) => (
                <div key={key} className="flex min-h-11 items-center justify-between">
                  <dt className="text-[17px]">{name}</dt>
                  <dd className="font-cifre text-[17px] tabular-nums">{s.avgNutrients === null ? dash : `${formatNumber(s.avgNutrients[key], decimals)} g`}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-1 text-[13px] text-testo-secondario">Al giorno, sui giorni con pasti.</p>
          </Card>
        </div>
      )}
      {data && store && panel && (() => {
        const common = { store, initialMonday: monday, today, onChanged: reload, onClose: () => setPanel(null) };
        return panel === "peso" ? <WeightPanel {...common} /> : panel === "libero" ? <FreeMealPanel {...common} /> : <ActivityWeekPanel {...common} kind={panel} />;
      })()}
      {settings && <SettingsPanel section={settings.section} onSectionChange={(section) => setSettings({ section })} onClose={() => setSettings(null)} />}
    </main>
  );
}
