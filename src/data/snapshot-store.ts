import type { DateKey } from "@/engine";
import type { DataStore } from "./store";
import { STORAGE_VERSION } from "./types";
import type { ActivityRecord, ChallengeLogEntry, MealRecord, StoredData, UserSettings, WeighIn } from "./types";

/** Dove vengono scritti i dati serializzati. */
export interface Persistence {
  /** Testo salvato, o null se non c'è nulla. Può lanciare se non leggibile. */
  read(): string | null;
  /** Può lanciare se non si riesce a scrivere. */
  write(text: string): void;
}

export const NOTICE_UNREADABLE = "I dati salvati non erano leggibili: l'app riparte vuota.";
export const NOTICE_UNKNOWN_VERSION = "I dati salvati sono di una versione sconosciuta: l'app riparte vuota.";
export const NOTICE_WRITE_FAILED = "Non è stato possibile salvare i dati su questo dispositivo.";

export function emptyData(): StoredData {
  return { version: STORAGE_VERSION, settings: {}, meals: [], activity: [], weighIns: [], challengeLog: [] };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type Parsed = { data: StoredData; notice: string | null };

function parse(text: string | null): Parsed {
  if (text === null) return { data: emptyData(), notice: null };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { data: emptyData(), notice: NOTICE_UNREADABLE };
  }
  if (!isObject(raw)) return { data: emptyData(), notice: NOTICE_UNREADABLE };
  if (raw.version !== STORAGE_VERSION) return { data: emptyData(), notice: NOTICE_UNKNOWN_VERSION };
  const ok =
    isObject(raw.settings) &&
    Array.isArray(raw.meals) &&
    Array.isArray(raw.activity) &&
    Array.isArray(raw.weighIns) &&
    Array.isArray(raw.challengeLog) &&
    [...raw.meals, ...raw.activity, ...raw.weighIns, ...raw.challengeLog].every(
      (r) => isObject(r) && typeof r.date === "string",
    );
  if (!ok) return { data: emptyData(), notice: NOTICE_UNREADABLE };
  return { data: raw as unknown as StoredData, notice: null };
}

const copy = <T>(v: T): T => structuredClone(v);
const inRange = (date: DateKey, from: DateKey, to: DateKey) => date >= from && date <= to;

/** Implementazione che tiene i dati in memoria e li scrive su `persistence` a ogni modifica. */
export class SnapshotDataStore implements DataStore {
  private data: StoredData;
  private notice: string | null;

  constructor(private readonly persistence: Persistence | null) {
    let text: string | null = null;
    let readFailed = false;
    try {
      text = persistence ? persistence.read() : null;
    } catch {
      readFailed = true;
    }
    const parsed = readFailed ? { data: emptyData(), notice: NOTICE_UNREADABLE } : parse(text);
    this.data = parsed.data;
    this.notice = parsed.notice;
  }

  private commit(): void {
    if (!this.persistence) return;
    try {
      this.persistence.write(JSON.stringify(this.data));
    } catch {
      this.notice = NOTICE_WRITE_FAILED;
    }
  }

  async getSettings() {
    return copy(this.data.settings);
  }

  async saveSettings(patch: { [K in keyof UserSettings]?: UserSettings[K] | undefined }) {
    const next: Record<string, unknown> = { ...this.data.settings };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete next[key];
      else next[key] = value;
    }
    this.data.settings = next as UserSettings;
    this.commit();
  }

  async resetSettings() {
    this.data.settings = {};
    this.commit();
  }

  async listMeals(date: DateKey) {
    return copy(this.data.meals.filter((m) => m.date === date));
  }

  async listMealsBetween(from: DateKey, to: DateKey) {
    return copy(this.data.meals.filter((m) => inRange(m.date, from, to)));
  }

  async saveMeal(meal: MealRecord) {
    const i = this.data.meals.findIndex((m) => m.id === meal.id);
    if (i >= 0) this.data.meals[i] = copy(meal);
    else this.data.meals.push(copy(meal));
    this.commit();
  }

  async deleteMeal(id: string) {
    this.data.meals = this.data.meals.filter((m) => m.id !== id);
    this.commit();
  }

  async getActivity(date: DateKey) {
    const a = this.data.activity.find((x) => x.date === date);
    return a ? copy(a) : null;
  }

  async listActivityBetween(from: DateKey, to: DateKey) {
    return copy(this.data.activity.filter((a) => inRange(a.date, from, to)));
  }

  async saveActivity(activity: ActivityRecord) {
    const i = this.data.activity.findIndex((a) => a.date === activity.date);
    if (i >= 0) this.data.activity[i] = copy(activity);
    else this.data.activity.push(copy(activity));
    this.commit();
  }

  async listWeighIns() {
    return copy([...this.data.weighIns].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async saveWeighIn(weighIn: WeighIn) {
    const i = this.data.weighIns.findIndex((w) => w.date === weighIn.date);
    if (i >= 0) this.data.weighIns[i] = copy(weighIn);
    else this.data.weighIns.push(copy(weighIn));
    this.commit();
  }

  async deleteWeighIn(date: DateKey) {
    this.data.weighIns = this.data.weighIns.filter((w) => w.date !== date);
    this.commit();
  }

  async listChallengeLog(date: DateKey) {
    return copy(this.data.challengeLog.filter((e) => e.date === date));
  }

  async listChallengeLogBetween(from: DateKey, to: DateKey) {
    return copy(this.data.challengeLog.filter((e) => inRange(e.date, from, to)));
  }

  async saveChallengeEntry(entry: ChallengeLogEntry) {
    const i = this.data.challengeLog.findIndex((e) => e.date === entry.date && e.exerciseId === entry.exerciseId);
    if (i >= 0) this.data.challengeLog[i] = copy(entry);
    else this.data.challengeLog.push(copy(entry));
    this.commit();
  }

  async deleteChallengeEntry(date: DateKey, exerciseId: string) {
    this.data.challengeLog = this.data.challengeLog.filter((e) => !(e.date === date && e.exerciseId === exerciseId));
    this.commit();
  }

  async getNotice() {
    return this.notice;
  }

  async clearNotice() {
    this.notice = null;
  }
}
