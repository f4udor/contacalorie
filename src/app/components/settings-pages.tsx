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
import { ChoiceField, DateField, SaveBar, useFieldsForm } from "./settings-fields";
import { DataSection } from "./data-section";
import { LinksSection } from "./links-section";
import { TextField } from "./field";
import { Sheet } from "./sheet";

const D = DEFAULT_SETTINGS;
const pct = (fraction: number) => formatNumber(fraction * 100, 1);

interface PageProps {
  store: DataStore;
  settings: UserSettings;
  weighIns: WeighIn[];
  today: DateKey;
  /** Rilegge le impostazioni dopo un salvataggio. */
  onChanged: () => void;
  /** Apre un'altra pagina di Impostazioni (per «Vai al Profilo»). */
  onNavigate: (section: SectionId) => void;
}

const card = "flex flex-col gap-4 rounded-2xl bg-card p-4";

/** Profilo: sesso, età, altezza, peso, peso obiettivo e data. */
export function ProfilePage({ store, settings, onChanged }: PageProps) {
  const keys: SettingsFieldKey[] = ["sex", "ageYears", "heightCm", "weightKg", "targetWeightKg", "targetDate"];
  const f = useFieldsForm(store, settings, keys, onChanged);
  const text = (key: SettingsFieldKey, label: string, opts: { hint?: string; inputMode?: "decimal" | "numeric" } = {}) => (
    <TextField id={`set-${key}`} label={label} value={f.values[key]} onChange={f.set(key)} error={f.errors[key]} inputMode={opts.inputMode ?? "decimal"} hint={opts.hint} />
  );
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <div className={card}>
        <ChoiceField
          id="set-sex"
          label="Sesso"
          value={f.values.sex}
          onChange={f.set("sex")}
          error={f.errors.sex}
          options={[
            { value: "uomo", label: "Uomo" },
            { value: "donna", label: "Donna" },
          ]}
        />
        {text("ageYears", "Età (anni)", { inputMode: "numeric" })}
        {text("heightCm", "Altezza (cm)")}
        {text("weightKg", "Peso (kg)", { hint: "Se hai delle pesate conta l'ultima." })}
        {text("targetWeightKg", "Peso obiettivo (kg)")}
        <DateField id="set-targetDate" label="Data obiettivo" value={f.values.targetDate} onChange={f.set("targetDate")} error={f.errors.targetDate} />
      </div>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Un numero degli obiettivi con la sua etichetta («calcolato», «personalizzato»…) e «Usa il valore calcolato». */
function GoalField({ id, label, unit, manual, calculated, kind, onChange, error }: { id: string; label: string; unit: string; manual: string; calculated: number | null; kind: "calcolato" | "predefinito" | "da calcolare"; onChange: (v: string) => void; error?: string }) {
  const isManual = manual.trim() !== "";
  const tag = goalLabel(manual, kind);
  const shown = isManual ? manual : calculated === null ? "" : String(calculated);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-muted">
          {label} ({unit})
        </label>
        <span data-goal-label className={`text-sm font-semibold ${isManual ? "text-accent" : "text-muted"}`}>
          {tag}
        </span>
      </div>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        placeholder={calculated === null ? "–" : undefined}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent ${isManual ? "" : "text-muted"} ${error ? "ring-2 ring-bad" : ""}`}
      />
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
      {isManual && (
        <button type="button" onClick={() => onChange("")} className="-ml-2 min-h-11 w-fit px-2 text-[15px] font-semibold text-accent">
          Usa il valore calcolato
        </button>
      )}
    </div>
  );
}

/** Obiettivi: kcal base e nutrienti (calcolati o personalizzati), basale in sola lettura, regole del recupero e dei semafori. */
export function GoalsPage({ store, settings, weighIns, today, onChanged, onNavigate }: PageProps) {
  const keys: SettingsFieldKey[] = ["baseKcal", "proteinGramsManual", "fatGramsManual", "fiberMin", "saltMax", "recoveryMaxPerDay", "creditCap", "margin"];
  const f = useFieldsForm(store, settings, keys, onChanged);
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

  const field = (key: SettingsFieldKey, label: string, placeholder: string, inputMode: "decimal" | "numeric" = "decimal") => (
    <TextField key={key} id={`set-${key}`} label={label} value={f.values[key]} onChange={f.set(key)} error={f.errors[key]} inputMode={inputMode} placeholder={placeholder} />
  );

  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      {!view.profileComplete && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4" data-profile-hint>
          <p className="text-[15px] font-medium">Completa il profilo per calcolare le tue kcal.</p>
          <button type="button" onClick={() => onNavigate("profilo")} className="flex min-h-11 shrink-0 items-center text-[15px] font-semibold text-accent">
            Vai al Profilo
          </button>
        </div>
      )}
      {view.earliestDate && (
        <div className="flex flex-col gap-2 rounded-2xl bg-card p-4" data-unreachable>
          <p className="text-[15px] font-medium">
            Con questa data la base resta al minimo. Prima data possibile: <strong>{formatDateFull(view.earliestDate)}</strong>
          </p>
          <button type="button" onClick={setEarliest} disabled={dateBusy} className="min-h-11 rounded-xl bg-bg px-4 text-[15px] font-semibold text-accent disabled:opacity-50">
            Imposta questa data
          </button>
        </div>
      )}
      <div className={card}>
        <GoalField id="set-baseKcal" label="Kcal base" unit="kcal" manual={f.values.baseKcal} calculated={view.baseCalculated} kind={view.baseKind} onChange={f.set("baseKcal")} error={f.errors.baseKcal} />
        {view.minimum !== null && (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-muted">Metabolismo basale</span>
              <span className="text-[17px] font-semibold tabular-nums">{formatNumber(view.minimum)} kcal</span>
            </div>
            <p className="mt-1 text-sm text-muted">La base del giorno non scende sotto questo valore</p>
          </div>
        )}
        <GoalField id="set-proteinGramsManual" label="Proteine" unit="g" manual={f.values.proteinGramsManual} calculated={view.proteinCalculated} kind={view.proteinCalculated === null ? "da calcolare" : "calcolato"} onChange={f.set("proteinGramsManual")} error={f.errors.proteinGramsManual} />
        <GoalField id="set-fatGramsManual" label="Grassi" unit="g" manual={f.values.fatGramsManual} calculated={view.fatCalculated} kind="calcolato" onChange={f.set("fatGramsManual")} error={f.errors.fatGramsManual} />
      </div>
      <div className={card}>
        {field("fiberMin", "Fibre minime (g)", formatNumber(D.fiberMin))}
        {field("saltMax", "Sale massimo (g)", formatNumber(D.saltMax, 1))}
        {field("recoveryMaxPerDay", "Recupero massimo al giorno (kcal)", formatNumber(D.recoveryMaxPerDay))}
        {field("creditCap", "Margine massimo della settimana (kcal)", formatNumber(D.creditCap))}
        {field("margin", "Margine dei semafori (%)", pct(D.margin))}
      </div>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Attività: quanto contano bici e passi sull'obiettivo del giorno. */
export function ActivityPage({ store, settings, onChanged }: PageProps) {
  const f = useFieldsForm(store, settings, ["kcalPerKm", "kcalPerStep", "stepThreshold", "bonusShare"], onChanged);
  const field = (key: SettingsFieldKey, label: string, placeholder: string, inputMode: "decimal" | "numeric" = "decimal") => (
    <TextField key={key} id={`set-${key}`} label={label} value={f.values[key]} onChange={f.set(key)} error={f.errors[key]} inputMode={inputMode} placeholder={placeholder} />
  );
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <div className={card}>
        {field("kcalPerKm", "Kcal per km in bici", formatNumber(D.kcalPerKm))}
        {field("kcalPerStep", "Kcal per passo", formatNumber(D.kcalPerStep, 2))}
        {field("stepThreshold", "Passi da cui si conta il bonus", formatNumber(D.stepThreshold), "numeric")}
        {field("bonusShare", "Quota di bonus (%)", pct(D.bonusShare))}
      </div>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Pasto libero: il tetto di kcal con cui conta nel budget. */
export function FreeMealPage({ store, settings, onChanged }: PageProps) {
  const f = useFieldsForm(store, settings, ["freeMealCap"], onChanged);
  return (
    <form onSubmit={f.save} noValidate className="flex flex-col gap-3">
      <div className={card}>
        <TextField id="set-freeMealCap" label="Tetto di kcal del pasto libero" value={f.values.freeMealCap} onChange={f.set("freeMealCap")} error={f.errors.freeMealCap} placeholder={formatNumber(D.freeMealCap)} />
      </div>
      <SaveBar status={f.status} saving={f.saving} />
    </form>
  );
}

/** Dati: esportazione e importazione, e il ripristino dei valori predefiniti. */
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
    <div className="flex flex-col gap-3">
      <DataSection />
      <button type="button" onClick={() => setConfirmReset(true)} className="min-h-12 rounded-xl bg-card px-4 text-[17px] font-semibold text-bad">
        Ripristina valori predefiniti
      </button>
      {confirmReset && (
        <Sheet open onClose={() => setConfirmReset(false)} title="Ripristinare?">
          <div className="flex flex-col gap-4">
            <p className="text-[17px]">Obiettivi, regole di calcolo, attività e pasto libero tornano ai valori predefiniti. Il profilo resta com&apos;è.</p>
            <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-bad-fill px-4 text-[17px] font-semibold text-white">
              Ripristina
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
              Annulla
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Collegamenti: stima automatica e dati da Salute. */
export function LinksPage() {
  return <LinksSection />;
}
