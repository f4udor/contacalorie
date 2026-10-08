import { MEAL_SLOTS } from "@/engine";
import type { MealSlot } from "@/engine";
import type { StoredData } from "@/data";

/** File CSV per Excel in italiano: separatore ";", numeri con la virgola, testo UTF-8 con segno iniziale (BOM). */
export const CSV_SEPARATOR = ";";
export const CSV_BOM = "﻿";

const SLOT_LABEL: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };
const SOURCE_LABEL: Record<string, string> = { manuale: "manuale", salute: "Salute" };

/** Un numero come lo scrive Excel in italiano: virgola decimale, nessun separatore delle migliaia. */
export function csvNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6).replace(".", ",");
}

/**
 * Un campo di testo: tra virgolette se contiene separatore, virgolette o a capo; un testo che comincia con = + - @
 * riceve un apice davanti, così Excel non lo scambia per una formula.
 */
export function csvText(value: string | null | undefined): string {
  let t = value ?? "";
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

function toCsv(header: string[], rows: string[][]): string {
  return CSV_BOM + [header, ...rows].map((r) => r.join(CSV_SEPARATOR)).join("\r\n") + "\r\n";
}

export interface CsvFile {
  /** Contenuto già pronto da scaricare. */
  content: string;
  /** Righe di dati (intestazione esclusa). */
  rows: number;
}

/** I piatti: data, pasto, piatto, quantità, kcal, macro, fibre, sale, libero. In ordine di data, fascia e inserimento. */
export function dishesCsv(data: Pick<StoredData, "meals">): CsvFile {
  const slotIndex = (s: MealSlot) => MEAL_SLOTS.indexOf(s);
  const sorted = data.meals
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.date.localeCompare(b.m.date) || slotIndex(a.m.slot) - slotIndex(b.m.slot) || a.i - b.i)
    .map((x) => x.m);
  const rows = sorted.map((m) => [
    m.date,
    SLOT_LABEL[m.slot],
    csvText(m.name),
    csvText(m.quantity),
    csvNumber(m.kcal),
    csvNumber(m.protein),
    csvNumber(m.carbs),
    csvNumber(m.fat),
    csvNumber(m.fiber),
    csvNumber(m.salt),
    m.isFree ? "sì" : "no",
  ]);
  return {
    content: toCsv(["Data", "Pasto", "Piatto", "Quantità", "Kcal", "Proteine (g)", "Carboidrati (g)", "Grassi (g)", "Fibre (g)", "Sale (g)", "Libero"], rows),
    rows: rows.length,
  };
}

/** Pesate e attività: una riga per giorno che ha almeno una delle due. */
export function measurementsCsv(data: Pick<StoredData, "weighIns" | "activity">): CsvFile {
  const dates = [...new Set([...data.weighIns.map((w) => w.date), ...data.activity.map((a) => a.date)])].sort();
  const rows = dates.map((d) => {
    const w = data.weighIns.find((x) => x.date === d);
    const a = data.activity.find((x) => x.date === d);
    return [
      d,
      csvNumber(w?.weightKg),
      csvNumber(a?.steps),
      a?.stepsSource ? SOURCE_LABEL[a.stepsSource] : "",
      csvNumber(a?.bikeKm),
      csvNumber(a?.bikeKcalHealth),
      a?.bikeSource ? SOURCE_LABEL[a.bikeSource] : "",
      csvNumber(a?.bikeKmManual),
      csvNumber(a?.bikeKcalManual),
    ];
  });
  return { content: toCsv(["Data", "Peso (kg)", "Passi", "Fonte passi", "Km in bici", "Kcal bici", "Fonte bici", "Km bici a mano", "Kcal bici a mano"], rows), rows: rows.length };
}
