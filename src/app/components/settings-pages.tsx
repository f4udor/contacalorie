"use client";

import { useState } from "react";
import { DEFAULT_SETTINGS } from "@/engine";
import type { DateKey } from "@/engine";
import type { DataStore, UserSettings, WeighIn } from "@/data";
import { formatDateFull, formatNumber } from "../lib/format";
import { defaultsPatch } from "../lib/settings-form";
import type { SettingsFieldKey } from "../lib/settings-form";
import { buildGoalsView, goalLabel } from "../lib/settings-sections";
import type { SectionId } from "../lib/settings-sections";
import { latestWeighInWeight } from "../lib/week-data";
import { SaveBar, useFieldsForm } from "./settings-fields";
import { DataSection } from "./data-section";
import { LinksSection } from "./links-section";
import { Sheet } from "./sheet";
import { ActionRow, Caption, DateInput, FieldRow, GroupedList, PillButton, RowInput, SelectInput } from "./ui/ui";

const D = DEFAULT_SETTINGS;
const pct = (fraction: number) => formatNumber(fraction * 100, 1);

interface PageProps {
  store: DataStore;
  settings: UserSettings;
  weighIns: WeighIn[];
  today: DateKey;
  /** Rilegge le impostazioni dopo un salvataggio. */
  onChanged: () => void;
  /** Apre un'altra pagina di Impostazioni (per «Apri Profilo»). */
  onNavigate: (section: SectionId) => void;
}

/** Una riga di campo numerico: il nome a sinistra, il valore a destra con l'unità accanto; il valore predefinito è il suggerimento del campo vuoto. */
function useRows(f: ReturnType<typeof useFieldsForm>) {
  return function row(key: SettingsFieldKey, label: string, unit: string, placeholder?: string, inputMode: "decimal" | "numeric" = "decimal") {
    return (
    <FieldRow key={key} label={label} htmlFor={`set-${key}`} unit={unit} error={f.errors[key]}>
      <RowInput id={`set-${key}`} value={f.values[key]} onChange={f.set(key)} inputMode={inputMode} placeholder={placeholder} invalid={Boolean(f.errors[key])} />
    </FieldRow>
    );
  };
}

const SEX_OPTIONS = [
  { value: "", label: "Da scegliere" },
  { value: "uomo", label: "Uomo" },
  { value: "donna", label: "Donna" },
] as const;

/** Profilo: sesso, età, altezza, peso, peso obiettivo e data. */
export function ProfilePage({ store, settings, onChanged }: PageProps) {
  const keys: SettingsFieldKey[] = ["sex", "ageYears", "heightCm", "weightKg", "targetWeightKg", "targetDate"];
  const f = useFieldsForm(store, settings, keys, onChanged);
  const row = useRows(f);
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <GroupedList>
        <FieldRow label="Sesso" htmlFor="set-sex" error={f.errors.sex}>
          <SelectInput id="set-sex" value={f.values.sex as "" | "uomo" | "donna"} options={SEX_OPTIONS} onChange={f.set("sex")} />
        </FieldRow>
        {row("ageYears", "Età", "anni", undefined, "numeric")}
        {row("heightCm", "Altezza", "cm")}
        {row("weightKg", "Peso", "kg")}
        {row("targetWeightKg", "Peso obiettivo", "kg")}
        <FieldRow label="Data obiettivo" htmlFor="set-targetDate" error={f.errors.targetDate}>
          <DateInput id="set-targetDate" value={f.values.targetDate} onChange={f.set("targetDate")} />
        </FieldRow>
      </GroupedList>
      <Caption>Se hai delle pesate conta l&apos;ultima.</Caption>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Obiettivi: calorie di base e nutrienti (calcolati o personalizzati), basale in sola lettura, regole del recupero e dei semafori. */
export function GoalsPage({ store, settings, weighIns, today, onChanged, onNavigate }: PageProps) {
  const keys: SettingsFieldKey[] = ["baseKcal", "proteinGramsManual", "fatGramsManual", "fiberMin", "saltMax", "recoveryMaxPerDay", "creditCap", "margin"];
  const f = useFieldsForm(store, settings, keys, onChanged);
  const row = useRows(f);
  // I valori calcolati vengono dalle impostazioni salvate (non da quelle in corso di modifica).
  const view = buildGoalsView(settings, today, latestWeighInWeight(weighIns, today) ?? null);
  const [dateBusy, setDateBusy] = useState(false);

  const setEarliest = async () => {
    if (!view.earliestDate) return;
    setDateBusy(true);
    try {
      await store.saveSettings({ targetDate: view.earliestDate });
      onChanged();
    } catch {
      // L'avviso in cima lo spiega; si può riprovare.
    } finally {
      setDateBusy(false);
    }
  };

  /** Un numero degli obiettivi: il calcolato compare nel campo (in grigio); scrivere un numero lo rende personalizzato. */
  const goal = (key: "baseKcal" | "proteinGramsManual" | "fatGramsManual", label: string, unit: string, calculated: number | null, kind: "calcolato" | "predefinito" | "da calcolare") => {
    const manual = f.values[key];
    const isManual = manual.trim() !== "";
    const tag = goalLabel(manual, kind);
    return [
      <FieldRow key={key} label={label} htmlFor={`set-${key}`} unit={unit} error={f.errors[key]} note={<span data-goal-label className={isManual ? "text-comando" : "text-testo-secondario"}>{tag}</span>}>
        <RowInput id={`set-${key}`} muted={!isManual} value={isManual ? manual : calculated === null ? "" : String(calculated)} placeholder={calculated === null ? "–" : undefined} onChange={f.set(key)} inputMode="decimal" invalid={Boolean(f.errors[key])} />
      </FieldRow>,
      isManual ? <ActionRow key={`${key}-reset`} label="Usa il valore calcolato" onClick={() => f.set(key)("")} /> : null,
    ];
  };

  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      {!view.profileComplete && (
        <div className="flex flex-col gap-2 rounded-elenco bg-tessera p-4" data-profile-hint>
          <p className="text-[15px]">Completa il profilo per calcolare le calorie.</p>
          <PillButton onClick={() => onNavigate("profilo")}>Apri Profilo</PillButton>
        </div>
      )}
      {view.earliestDate && (
        <div className="flex flex-col gap-2 rounded-elenco bg-tessera p-4" data-unreachable>
          <p className="text-[15px]">
            Data troppo vicina. Prima data possibile: <strong>{formatDateFull(view.earliestDate)}</strong>
          </p>
          <PillButton disabled={dateBusy} onClick={setEarliest}>
            Usa questa data
          </PillButton>
        </div>
      )}
      <GroupedList>
        {goal("baseKcal", "Calorie di base", "kcal", view.baseCalculated, view.baseKind)}
        {goal("proteinGramsManual", "Proteine", "g", view.proteinCalculated, view.proteinCalculated === null ? "da calcolare" : "calcolato")}
        {goal("fatGramsManual", "Grassi", "g", view.fatCalculated, "calcolato")}
      </GroupedList>
      {view.minimum !== null && (
        <div className="flex flex-col gap-1.5">
          <GroupedList>
            <li className="flex min-h-12 items-center justify-between gap-3 px-4 text-[17px]">
              <span>Metabolismo basale stimato</span>
              <span className="shrink-0 text-testo-secondario">{formatNumber(view.minimum)} kcal</span>
            </li>
          </GroupedList>
          <Caption>È una stima dal profilo, non una misura precisa. Le calorie di base non scendono sotto questo valore.</Caption>
        </div>
      )}
      <GroupedList>
        {row("fiberMin", "Fibre minime", "g", formatNumber(D.fiberMin))}
        {row("saltMax", "Sale massimo", "g", formatNumber(D.saltMax, 1))}
        {row("recoveryMaxPerDay", "Recupero massimo al giorno", "kcal", formatNumber(D.recoveryMaxPerDay))}
        {row("creditCap", "Margine massimo della settimana", "kcal", formatNumber(D.creditCap))}
        {row("margin", "Margine dei semafori", "%", pct(D.margin))}
      </GroupedList>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Attività: quanto contano bici e passi sull'obiettivo del giorno. */
export function ActivityPage({ store, settings, onChanged }: PageProps) {
  const f = useFieldsForm(store, settings, ["kcalPerKm", "kcalPerStep", "stepThreshold", "bonusShare"], onChanged);
  const row = useRows(f);
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <GroupedList>
        {row("kcalPerKm", "Calorie per km in bici", "kcal", formatNumber(D.kcalPerKm))}
        {row("kcalPerStep", "Calorie per passo", "kcal", formatNumber(D.kcalPerStep, 2))}
        {row("stepThreshold", "Passi oltre cui contano", "passi", formatNumber(D.stepThreshold), "numeric")}
        {row("bonusShare", "Quota dell'attività aggiunta all'obiettivo", "%", pct(D.bonusShare))}
      </GroupedList>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Pasto libero: il tetto di calorie con cui conta. */
export function FreeMealPage({ store, settings, onChanged }: PageProps) {
  const f = useFieldsForm(store, settings, ["freeMealCap"], onChanged);
  const row = useRows(f);
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <GroupedList>{row("freeMealCap", "Calorie massime contate", "kcal", formatNumber(D.freeMealCap))}</GroupedList>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Esporta i dati: esportazione e importazione, e il ripristino dei valori predefiniti. */
export function DataPage({ store, onChanged }: { store: DataStore; onChanged: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const reset = async () => {
    try {
      await store.saveSettings(defaultsPatch());
    } catch {
      return; // l'avviso in cima lo spiega; il pannello resta aperto per riprovare
    }
    setConfirmReset(false);
    onChanged();
  };
  return (
    <div className="flex flex-col gap-4">
      <DataSection />
      <GroupedList>
        <ActionRow label="Ripristina valori predefiniti" tone="fuori" onClick={() => setConfirmReset(true)} />
      </GroupedList>
      {confirmReset && (
        <Sheet open onClose={() => setConfirmReset(false)} title="Ripristinare?">
          <div className="flex flex-col gap-4">
            <p className="px-1 text-[17px]">Obiettivi, regole di calcolo, attività e pasto libero tornano ai valori predefiniti. Il profilo resta com&apos;è.</p>
            <GroupedList>
              <ActionRow label="Ripristina" tone="fuori" onClick={reset} />
            </GroupedList>
            <PillButton onClick={() => setConfirmReset(false)}>Annulla</PillButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Collegamenti: Salute e stime dei pasti. */
export function LinksPage() {
  return <LinksSection />;
}

export { latestWeighInWeight };
