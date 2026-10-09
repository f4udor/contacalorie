"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FavoriteDish, MealRecord } from "@/data";
import type { MealSlot } from "@/engine";
import { useDataStore } from "./data-provider";
import { ActivityCard } from "./components/activity-card";
import { AddPanel, EditBikePanel, EditMealPanel, SaveMealPanel } from "./components/add-panel";
import { MealList } from "./components/meal-list";
import { Card } from "./components/ui/ui";
import { ScreenHeader } from "./components/screen-header";
import { AddButton } from "./components/add-button";
import { SettingsPanel } from "./components/settings-view";
import { KcalRing } from "./components/kcal-ring";
import { NutrientCard } from "./components/nutrient-card";
import { formatDateLong, formatDayMonth, formatNumber, formatSigned, formatWeekday } from "./lib/format";
import { dayNav } from "./lib/nav";
import type { SectionId } from "./lib/settings-sections";
import { isFavoriteDish, toggleFavoriteDish } from "./lib/favorites";
import { newId } from "./lib/ids";
import { currentWeight, buildTodayView, hasCompositionDetail } from "./lib/today-view";
import { useToday } from "./lib/use-today";
import { HealthWarning } from "./components/health-warning";
import { useWeekData } from "./lib/use-week-data";

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/** Schermata Oggi (parte alta: data, anello, composizione dell'obiettivo, nutrienti). */
export function OggiScreen() {
  const today = useToday();
  const param = useSearchParams().get("d");
  const date = param && DATE_PARAM.test(param) ? param : today;
  const { data, reload } = useWeekData(date);
  const store = useDataStore();
  const [panel, setPanel] = useState<{ kind: "add"; slot?: MealSlot } | { kind: "edit"; meal: MealRecord } | { kind: "bike" } | { kind: "saveMeal"; slot: MealSlot } | null>(null);

  // Pannello delle Impostazioni (aperto dall'ingranaggio): `null` = chiuso, altrimenti la pagina aperta (`section: null` = l'elenco).
  const [settings, setSettings] = useState<{ section: SectionId | null } | null>(null);
  const [favoriteNote, setFavoriteNote] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteDish[]>([]);
  const panelOpen = panel !== null;
  const loadFavorites = useCallback(() => {
    if (!store) return Promise.resolve();
    return store.listFavoriteDishes().then(setFavorites, () => {
      // L'avviso in cima lo spiega.
    });
  }, [store]);
  // Si rileggono all'apertura e dopo ogni pannello (un piatto può essere stato salvato o tolto dai preferiti lì dentro).
  useEffect(() => {
    if (!store) return;
    let alive = true;
    store.listFavoriteDishes().then(
      (list) => alive && setFavorites(list),
      () => {
        // L'avviso in cima lo spiega.
      },
    );
    return () => {
      alive = false;
    };
  }, [store, panelOpen]);

  if (!today || !date) return <main aria-busy="true" />;

  const favoriteDish = async (dish: MealRecord) => {
    if (!store) return;
    try {
      const done = await toggleFavoriteDish(store, dish, newId);
      await loadFavorites();
      setFavoriteNote(done === "salvato" ? "Salvato nei preferiti." : "Tolto dai preferiti.");
      setTimeout(() => setFavoriteNote(null), 3000);
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    }
  };
  const deleteDish = async (dish: MealRecord) => {
    if (!store) return;
    try {
      await store.deleteMeal(dish.id);
      reload();
    } catch {
      // L'avviso in cima lo spiega; il piatto resta.
    }
  };

  const view = data
    ? buildTodayView({
        date,
        today,
        days: data.days,
        settings: data.settings,
        weightKg: currentWeight(data.weighIns, date, data.userSettings.weightKg),
        targetWeightKg: data.userSettings.targetWeightKg ?? null,
      })
    : null;

  const meals = data?.meals.filter((m) => m.date === date) ?? [];
  const activity = data?.activity.find((a) => a.date === date) ?? null;
  const weighIn = data?.weighIns.find((w) => w.date === date) ?? null;
  const panelContext =
    data && store
      ? { store, date, days: data.days, settings: data.settings, activity, weightKg: weighIn?.weightKg ?? null, onChanged: reload, onClose: () => setPanel(null) }
      : null;

  return (
    <main>
      <ScreenHeader
        kicker={date === today ? formatDateLong(date) : formatDayMonth(date)}
        title={date === today ? "Oggi" : formatWeekday(date)}
        nav={dayNav(date, today)}
        prevLabel="Giorno precedente"
        nextLabel="Giorno successivo"
        nowLabel="Torna a oggi"
        onSettings={() => setSettings({ section: null })}
      />
      <div className="pt-3">
        <HealthWarning onOpen={() => setSettings({ section: "collegamenti" })} />
      </div>
      {view && (
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col items-center pb-5 pt-6">
            <KcalRing remaining={view.remaining} progress={view.ringProgress} color={view.ringColor} eaten={view.eaten} target={view.target} empty={!view.hasMeals} />
            {hasCompositionDetail(view.composition) && (
            <p className="mt-4 text-center text-sm text-muted" aria-label="Composizione dell'obiettivo">
              {view.composition
                .map((c) => `${c.label} ${c.signed ? formatSigned(c.amount) : formatNumber(c.amount)}`)
                .join(" · ")}
            </p>
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {view.nutrients.map((n, i) => (
              <NutrientCard key={n.key} n={n} onOpenProfile={() => setSettings({ section: "profilo" })} wide={i === view.nutrients.length - 1 && view.nutrients.length % 2 === 1} />
            ))}
          </div>
          <MealList dishes={meals} settings={data!.settings} onSelectDish={(meal) => setPanel({ kind: "edit", meal })} onAddDish={(slot) => setPanel({ kind: "add", slot })} onSaveMeal={(slot) => setPanel({ kind: "saveMeal", slot })} isFavorite={(d) => isFavoriteDish(favorites, d)} onFavoriteDish={favoriteDish} onDeleteDish={deleteDish} />
          {favoriteNote && (
            <p role="status" className="px-1 text-center text-sm font-semibold text-ok">
              {favoriteNote}
            </p>
          )}
          <ActivityCard activity={activity} settings={data!.settings} onEditBike={() => setPanel({ kind: "bike" })} />
        </div>
      )}
      <AddButton onClick={() => setPanel({ kind: "add" })} />
      {settings && <SettingsPanel section={settings.section} onSectionChange={(section) => setSettings({ section })} onClose={() => setSettings(null)} />}
      {panelContext && panel?.kind === "add" && <AddPanel {...panelContext} initialSlot={panel.slot} />}
      {panelContext && panel?.kind === "bike" && <EditBikePanel {...panelContext} />}
      {panelContext && panel?.kind === "saveMeal" && <SaveMealPanel {...panelContext} slot={panel.slot} />}
      {panelContext && panel?.kind === "edit" && <EditMealPanel {...panelContext} meal={panel.meal} />}
    </main>
  );
}
