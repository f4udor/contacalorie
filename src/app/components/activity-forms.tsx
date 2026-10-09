"use client";

import { useEffect, useState } from "react";
import type { DateKey } from "@/engine";
import type { ActivityRecord, DataStore } from "@/data";
import { bikeToForm, hasManualBike, validateActivityDay, validateBikeForm, validateWeight } from "../lib/activity-form";
import type { BikeFormErrors, BikeFormValues, ParsedBike } from "../lib/activity-form";
import { formatNumber } from "../lib/format";
import { deleteActivityValue, saveManualBike } from "../lib/week-actions";
import { Caption, DateInput, FieldRow, GroupedList, RowInput, ActionRow } from "./ui/ui";

interface DayField {
  value: string;
  onChange: (day: string) => void;
  max: DateKey;
  error?: string;
}

function DayRow({ id, day }: { id: string; day: DayField }) {
  return (
    <FieldRow label="Giorno" htmlFor={id} error={day.error}>
      <DateInput id={id} value={day.value} onChange={day.onChange} max={day.max} />
    </FieldRow>
  );
}

/**
 * Modulo «Uscita in bici»: giorno (calendario di sistema, mai futuro), distanza e calorie facoltative. È la parte a mano della bici,
 * che si somma ai km di Salute. Distanza e calorie: almeno uno. «Salva» è nell'intestazione del pannello (`formId`).
 */
export function BikeForm({ formId, day, existing, kcalPerKm, onSubmit, onDelete }: { formId: string; day: DayField; existing: ActivityRecord | null; kcalPerKm: number; onSubmit: (bike: ParsedBike) => Promise<void> | void; onDelete?: () => Promise<void> | void }) {
  const [values, setValues] = useState<BikeFormValues>(() => bikeToForm(existing));
  const [errors, setErrors] = useState<BikeFormErrors>({});
  const [saving, setSaving] = useState(false);
  const set = (key: keyof BikeFormValues) => (v: string) => setValues((x) => ({ ...x, [key]: v }));

  const guarded = async (fn: () => Promise<void> | void) => {
    setSaving(true);
    try {
      await fn();
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e il modulo resta com'è, per riprovare.
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateBikeForm(values);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    await guarded(() => onSubmit(r.bike));
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3">
      <GroupedList>
        <DayRow id="bike-day" day={day} />
        <FieldRow label="Distanza" htmlFor="bike-km" unit="km" error={errors.km}>
          <RowInput id="bike-km" value={values.km} onChange={set("km")} inputMode="decimal" invalid={Boolean(errors.km)} />
        </FieldRow>
        <FieldRow label="Calorie" htmlFor="bike-kcal" unit="kcal" error={errors.kcal}>
          <RowInput id="bike-kcal" value={values.kcal} onChange={set("kcal")} inputMode="numeric" placeholder="facoltative" invalid={Boolean(errors.kcal)} />
        </FieldRow>
      </GroupedList>
      <Caption>{`Senza calorie le calcola l'app: ${formatNumber(kcalPerKm)} kcal per km. Si somma ai km arrivati da Salute.`}</Caption>
      {onDelete && (
        <GroupedList>
          <ActionRow label="Elimina uscita" tone="fuori" disabled={saving} onClick={() => void guarded(onDelete)} />
        </GroupedList>
      )}
    </form>
  );
}

/**
 * «Uscita in bici» con il giorno scelto dall'utente: parte dal giorno da cui si arriva; cambiando giorno il modulo carica l'uscita a mano
 * già salvata per quel giorno (se c'è) e «Salva» la sostituisce, così resta una sola uscita a mano per giorno. Nessun giorno futuro.
 */
export function BikeEntry({ store, initialDay, today, kcalPerKm, formId, onDone }: { store: DataStore; initialDay: DateKey; today: DateKey; kcalPerKm: number; formId: string; onDone: () => void }) {
  const [day, setDay] = useState<DateKey>(initialDay);
  const [loaded, setLoaded] = useState<{ day: DateKey; activity: ActivityRecord | null } | null>(null);

  useEffect(() => {
    let alive = true;
    store.getActivity(day).then(
      (activity) => alive && setLoaded({ day, activity }),
      () => {
        // Lettura non riuscita: l'avviso in cima lo spiega.
      },
    );
    return () => {
      alive = false;
    };
  }, [store, day]);

  const dayError = validateActivityDay(day, today) ?? undefined;
  if (!loaded || loaded.day !== day) return null;
  return (
    <BikeForm
      key={day}
      formId={formId}
      day={{ value: day, onChange: setDay, max: today, error: dayError }}
      existing={loaded.activity}
      kcalPerKm={kcalPerKm}
      onSubmit={async (bike) => {
        if (validateActivityDay(day, today)) return;
        await saveManualBike(store, day, bike);
        onDone();
      }}
      onDelete={hasManualBike(loaded.activity) ? async () => { await deleteActivityValue(store, day, "bici"); onDone(); } : undefined}
    />
  );
}

/** Modulo «Pesata»: un peso in kg per giorno; una seconda pesata nello stesso giorno sostituisce la prima. Con `day` il giorno si sceglie. */
export function WeightForm({ formId, existingKg, onSubmit, day }: { formId: string; existingKg: number | null; onSubmit: (kg: number) => Promise<void> | void; day?: DayField }) {
  const [value, setValue] = useState(existingKg === null ? "" : String(existingKg).replace(".", ","));
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateWeight(value);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(undefined);
    try {
      await onSubmit(r.weightKg);
    } catch {
      // Salvataggio non riuscito: l'avviso in cima lo spiega e il modulo resta com'è, per riprovare.
    }
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3">
      <GroupedList>
        {day && <DayRow id="weigh-day" day={day} />}
        <FieldRow label="Peso" htmlFor="weight-kg" unit="kg" error={error}>
          <RowInput id="weight-kg" value={value} onChange={setValue} inputMode="decimal" invalid={Boolean(error)} />
        </FieldRow>
      </GroupedList>
      <Caption>{existingKg === null ? "Una pesata al giorno." : "Sostituisce la pesata di questo giorno."}</Caption>
    </form>
  );
}
