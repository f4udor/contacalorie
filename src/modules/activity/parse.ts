/** Lettura tollerante dei dati da Salute: il testo è scritto a mano dentro un Comando rapido. Nessun accesso a data, ora o rete. */

export type HealthField = "passi" | "bici_km";

export interface HealthEntry {
  /** Data aaaa-MM-gg. */
  date: string;
  value: number;
}

export interface HealthDiscard {
  /** La riga come è arrivata (accorciata se lunga). */
  riga: string;
  motivo: string;
}

export interface HealthParsed {
  entries: HealthEntry[];
  discarded: HealthDiscard[];
}

const MAX_LINES = 200;

const show = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s);

function realDate(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
}

/** `aaaa-MM-gg` oppure `gg/MM/aaaa`; null se non è una data vera. */
export function parseHealthDate(text: string): string | null {
  const t = text.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) return realDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const it = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (it) return realDate(Number(it[3]), Number(it[2]), Number(it[1]));
  return null;
}

type Num = { value: number } | { reason: string };

/** Toglie un'unità dopo il numero ("conteggio", "passi", "km"). */
function splitUnit(text: string): { num: string; ok: boolean } {
  const m = /^(-?[\d][\d.,\s ]*?)\s*([A-Za-zÀ-ÿ.]*)$/.exec(text.trim());
  if (!m) return { num: "", ok: false };
  return { num: m[1].trim(), ok: true };
}

/** Passi: intero; "8.123" e "8 123" valgono 8123, "8123,0" e "8123.0" valgono 8123. */
export function parseSteps(text: string): Num {
  const { num, ok } = splitUnit(text);
  if (!ok || num === "") return { reason: "valore non leggibile" };
  if (num.startsWith("-")) return { reason: "valore negativo" };
  let v: number;
  if (/^\d{1,3}([.,\s ]\d{3})+$/.test(num)) v = Number(num.replace(/[.,\s ]/g, ""));
  else if (/^\d+([.,]\d+)?$/.test(num)) v = Math.round(Number(num.replace(",", ".")));
  else return { reason: "valore non leggibile" };
  return v > 0 ? { value: v } : { reason: "valore zero" };
}

/** Km: decimale con virgola o punto ("12,4", "12.4", "1.234" = 1,234), due decimali. */
export function parseKm(text: string): Num {
  const { num, ok } = splitUnit(text);
  if (!ok || num === "") return { reason: "valore non leggibile" };
  if (num.startsWith("-")) return { reason: "valore negativo" };
  let n = num.replace(/[\s ]/g, "");
  if (n.includes(".") && n.includes(",")) {
    // L'ultimo separatore è il decimale, l'altro separa le migliaia.
    const decimal = n.lastIndexOf(".") > n.lastIndexOf(",") ? "." : ",";
    n = n.split(decimal === "." ? "," : ".").join("").replace(decimal, ".");
  } else n = n.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(n)) return { reason: "valore non leggibile" };
  const v = Math.round(Number(n) * 100) / 100;
  return v > 0 ? { value: v } : { reason: "valore zero" };
}

const parseValue = (field: HealthField, text: string): Num => (field === "passi" ? parseSteps(text) : parseKm(text));

function numberFromJson(field: HealthField, v: number): Num {
  if (!Number.isFinite(v)) return { reason: "valore non leggibile" };
  if (v < 0) return { reason: "valore negativo" };
  if (field === "passi") return v >= 0.5 ? { value: Math.round(v) } : { reason: "valore zero" };
  const r = Math.round(v * 100) / 100;
  return r > 0 ? { value: r } : { reason: "valore zero" };
}

const LINE = /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4})[\s;,]+(.*)$/;

/** Legge il campo `passi` o `bici_km`: testo con una riga `data;valore` per giorno, oppure elenco di `{ data, valore }`. */
export function parseHealthField(field: HealthField, raw: unknown): HealthParsed {
  const out: HealthParsed = { entries: [], discarded: [] };
  const add = (rawLine: string, dateText: string, num: Num) => {
    const date = parseHealthDate(dateText);
    if (!date) return void out.discarded.push({ riga: show(rawLine), motivo: "data non valida" });
    if ("reason" in num) return void out.discarded.push({ riga: show(rawLine), motivo: num.reason });
    out.entries.push({ date, value: num.value });
  };

  if (typeof raw === "string") {
    const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
    for (const line of lines.slice(0, MAX_LINES)) {
      const m = LINE.exec(line.trim());
      if (!m) {
        out.discarded.push({ riga: show(line.trim()), motivo: "riga non leggibile: manca la data o il valore" });
        continue;
      }
      add(line.trim(), m[1], parseValue(field, m[2]));
    }
    if (lines.length > MAX_LINES) out.discarded.push({ riga: `(altre ${lines.length - MAX_LINES} righe)`, motivo: "troppe righe" });
  } else if (Array.isArray(raw)) {
    for (const item of raw.slice(0, MAX_LINES)) {
      const o = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
      const label = show(JSON.stringify(item) ?? String(item));
      if (!o || typeof o.data !== "string") {
        out.discarded.push({ riga: label, motivo: "elemento non leggibile: serve data e valore" });
        continue;
      }
      const v = o.valore;
      const num: Num = typeof v === "number" ? numberFromJson(field, v) : typeof v === "string" ? parseValue(field, v) : { reason: "valore mancante" };
      add(label, o.data, num);
    }
    if (raw.length > MAX_LINES) out.discarded.push({ riga: `(altri ${raw.length - MAX_LINES} elementi)`, motivo: "troppi elementi" });
  } else if (raw !== undefined && raw !== null) {
    out.discarded.push({ riga: show(String(raw)), motivo: "formato non riconosciuto" });
  }
  return out;
}
