"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChallengeLogEntry, DataStore } from "@/data";
import type { DateKey } from "@/engine";
import { formatDayMonth, formatWeekday } from "../lib/format";
import { parseWhole } from "../lib/activity-form";
import type { ChallengeView, ExerciseView } from "../lib/challenge-view";
import { TextField } from "./field";
import { Sheet } from "./sheet";

interface Props {
  view: ChallengeView;
  date: DateKey;
  store: DataStore;
  onChanged: () => void;
}

const SAFETY_NOTE = "Fermati se senti dolore a inguine o pube e salta l'esercizio.";

function repsText(e: ExerciseView): string {
  return `${e.reps} ${e.perSide ? "per lato" : e.reps === 1 ? "ripetizione" : "ripetizioni"}`;
}

function StatusMark({ status }: { status: ExerciseView["status"] }) {
  if (status === "fatto") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (status === "saltato") {
    return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-track text-lg font-bold leading-none text-muted" aria-hidden="true">–</span>;
  }
  return <span className="block h-7 w-7 rounded-full border-2 border-muted/60" aria-hidden="true" />;
}

/** Sezione "Sfida mattutina" di Oggi. */
export function ChallengeSection({ view, date, store, onChanged }: Props) {
  const [open, setOpen] = useState<ExerciseView | null>(null);

  const write = async (fn: () => Promise<void>) => {
    await fn();
    onChanged();
  };
  const entry = (e: ExerciseView, status: ChallengeLogEntry["status"], reps: number | null): ChallengeLogEntry => ({ date, exerciseId: e.id, status, reps });
  const toggleDone = (e: ExerciseView) =>
    write(() => (e.status === "fatto" ? store.deleteChallengeEntry(date, e.id) : store.saveChallengeEntry(entry(e, "fatto", e.reps === e.planReps ? null : e.reps))));

  return (
    <section aria-label="Sfida mattutina">
      <h2 className="px-1 pb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">Sfida mattutina</h2>
      {view.kind === "in-corso" ? (
        <div className="rounded-2xl bg-card">
          <p className="px-4 pb-1 pt-3 text-[17px] font-semibold tabular-nums">
            Giorno {view.day}/{view.totalDays} · fatti {view.done} su {view.exercises.length}
          </p>
          <ul>
            {view.exercises.map((e) => (
              <li key={e.id} className="flex items-center border-t border-line first:border-t-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={e.status === "fatto"}
                  aria-label={`${e.name}: fatto`}
                  onClick={() => toggleDone(e)}
                  className="flex min-h-14 min-w-14 items-center justify-center"
                >
                  <StatusMark status={e.status} />
                </button>
                <button type="button" onClick={() => setOpen(e)} className="flex min-h-14 flex-1 items-center justify-between gap-3 py-2 pr-4 text-left">
                  <span className="min-w-0">
                    <span className={`block break-words text-[17px] font-semibold leading-snug ${e.status === "saltato" ? "text-muted line-through" : ""}`}>
                      {e.name}
                      {e.isNew && <span className="ml-2 rounded-full bg-track px-2 py-0.5 align-middle text-xs font-semibold text-accent no-underline">nuovo</span>}
                    </span>
                    <span className="block text-sm text-muted">{e.status === "saltato" ? "saltato" : repsText(e)}</span>
                  </span>
                  {e.reps !== e.planReps && e.status !== "saltato" && <span className="shrink-0 text-xs font-semibold text-muted">modificate</span>}
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-3 text-sm text-muted">{SAFETY_NOTE}</p>
        </div>
      ) : (
        view.kind === "senza-data" ? (
          <Link href="/impostazioni" className="block min-h-14 rounded-2xl bg-card px-4 py-4 text-[15px] text-muted">
            La sfida non ha una data di inizio. <span className="font-semibold text-accent">Impostala nelle Impostazioni</span>
          </Link>
        ) : (
          <div className="rounded-2xl bg-card px-4 py-4 text-[15px] text-muted">
            {view.kind === "non-iniziata" && `La sfida non è ancora iniziata: parte ${formatWeekday(view.startDate).toLowerCase()} ${formatDayMonth(view.startDate)}.`}
            {view.kind === "completata" && "Sfida completata: i 30 giorni sono passati."}
          </div>
        )
      )}
      {open && <ExercisePanel exercise={open} onClose={() => setOpen(null)} onSave={(status, reps) => write(async () => { await store.saveChallengeEntry(entry(open, status, reps)); })} onClear={() => write(() => store.deleteChallengeEntry(date, open.id))} />}
    </section>
  );
}

function ExercisePanel({
  exercise,
  onClose,
  onSave,
  onClear,
}: {
  exercise: ExerciseView;
  onClose: () => void;
  onSave: (status: "fatto" | "saltato", reps: number | null) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [value, setValue] = useState(String(exercise.reps));
  const [error, setError] = useState<string | undefined>();

  const done = async () => {
    const r = parseWhole(value);
    if (r === "empty" || r === "invalid") {
      setError("Inserisci un numero intero");
      return;
    }
    await onSave("fatto", r === exercise.planReps ? null : r);
    onClose();
  };
  const skip = async () => {
    await onSave("saltato", null);
    onClose();
  };
  const clear = async () => {
    await onClear();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={exercise.name}>
      <div className="flex flex-col gap-4">
        <TextField
          id="ex-reps"
          label={exercise.perSide ? "Ripetizioni per lato" : "Ripetizioni"}
          value={value}
          onChange={setValue}
          error={error}
          inputMode="numeric"
          hint={`Previste dal piano: ${exercise.planReps}`}
        />
        <button type="button" onClick={done} className="min-h-12 rounded-xl bg-accent px-4 text-[17px] font-semibold text-white">
          Fatto
        </button>
        <button type="button" onClick={skip} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-fg">
          Salta
        </button>
        {exercise.status !== "da-fare" && (
          <button type="button" onClick={clear} className="min-h-12 rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
            Rimetti da fare
          </button>
        )}
        <p className="text-sm text-muted">{SAFETY_NOTE}</p>
      </div>
    </Sheet>
  );
}
