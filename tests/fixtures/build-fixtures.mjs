// Genera gli scenari di dati di esempio (tests/fixtures/*.json) usati da `npm run screens`.
// Uso: node tests/fixtures/build-fixtures.mjs
// Giorni di riferimento: lunedì 2026-01-05 … domenica 2026-01-11 (giovedì = 2026-01-08).
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

let n = 0;
const meal = (date, slot, name, kcal, p, c, f, fib, salt, extra = {}) => ({
  id: `m${++n}`, date, slot, name, kcal, protein: p, carbs: c, fat: f, fiber: fib, salt, isFree: false, originalText: null, ...extra,
});
const activity = (date, a) => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, ...a });
const data = (parts = {}) => ({ version: 1, settings: {}, meals: [], activity: [], weighIns: [], challengeLog: [], ...parts });

const scenarios = [];
// "scorre": la schermata è più lunga di 844 px e scorre in verticale (voluto): lo screenshot la mostra intera.
const add = (id, descrizione, oggi, dati, extra = {}) => scenarios.push({ id, descrizione, oggi, percorso: "/", dati, scorre: true, ...extra });

// --- Guscio e avvisi (T2.1)
scenarios.push({ id: "grafici-in-arrivo", descrizione: "Grafici mostra solo 'In arrivo'.", oggi: "2026-01-08", percorso: "/grafici", dati: null });
scenarios.push({ id: "pannello-chiuso", descrizione: "Pagina di prova del pannello, prima di aprirlo.", oggi: "2026-01-08", percorso: "/prova/pannello", dati: null });
scenarios.push({ id: "pannello-aperto", descrizione: "Pannello dal basso aperto.", oggi: "2026-01-08", percorso: "/prova/pannello", dati: null, passi: [{ click: "Apri pannello" }] });
scenarios.push({ id: "avviso-dati-illeggibili", descrizione: "Dati salvati corrotti: l'app riparte vuota e mostra l'avviso.", oggi: "2026-01-08", percorso: "/", dati: "{{non json", scorre: true });

// --- Oggi: anello e nutrienti (T2.2)
add("oggi-vuoto", "Giorno senza pasti e profilo senza peso: anello pieno di kcal rimaste, barrette neutre, invito a inserire il peso.", "2026-01-08", null);

add(
  "oggi-normale",
  "Giorno normale (lunedì), peso 92 kg dall'ultima pesata (il profilo dice 100): proteine 130 g.",
  "2026-01-05",
  data({
    settings: { weightKg: 100 },
    weighIns: [{ date: "2026-01-02", weightKg: 92 }],
    meals: [
      meal("2026-01-05", "colazione", "Cappuccino e brioche", 320, 8, 48, 10, 1, 0.4),
      meal("2026-01-05", "pranzo", "Pasta al pomodoro", 650, 22, 110, 12, 6, 1.8),
      meal("2026-01-05", "spuntino", "Yogurt greco", 150, 15, 8, 5, 0, 0.2),
    ],
  }),
);

add(
  "oggi-caso-b",
  "Caso B del brief: giovedì dopo lunedì 1.750, martedì 1.800 e mercoledì 3.250 kcal (9.000 passi): saldo −425, recupero −106, obiettivo 1.994.",
  "2026-01-08",
  data({
    settings: { weightKg: 100 },
    meals: [
      meal("2026-01-05", "pranzo", "Pranzo", 1750, 90, 200, 60, 20, 4),
      meal("2026-01-06", "pranzo", "Pranzo", 1800, 100, 210, 65, 22, 4),
      meal("2026-01-07", "pranzo", "Cena fuori", 3250, 120, 380, 140, 18, 8),
      meal("2026-01-08", "colazione", "Latte e biscotti", 350, 12, 55, 9, 2, 0.5),
      meal("2026-01-08", "pranzo", "Riso e pollo", 700, 45, 90, 14, 5, 2),
    ],
    activity: [activity("2026-01-07", { steps: 9000, stepsSource: "manuale" })],
  }),
);

add(
  "oggi-bici",
  "Caso E del brief: 30 km in bici a mano: bonus 405, obiettivo 2.505, carboidrati 329 g.",
  "2026-01-05",
  data({
    settings: { weightKg: 100 },
    meals: [
      meal("2026-01-05", "colazione", "Pane e marmellata", 380, 9, 70, 6, 3, 0.8),
      meal("2026-01-05", "pranzo", "Pasta al ragù", 800, 35, 100, 25, 6, 2.2),
    ],
    activity: [activity("2026-01-05", { bikeKm: 30, bikeSource: "manuale" })],
  }),
);

add(
  "oggi-sforato",
  "Giorno sopra l'obiettivo: anello rosso, 'sopra di', nutrienti fuori misura.",
  "2026-01-05",
  data({
    settings: { weightKg: 100 },
    meals: [
      meal("2026-01-05", "pranzo", "Pizza grande", 1300, 50, 160, 45, 8, 6.5),
      meal("2026-01-05", "cena", "Hamburger e patatine", 1500, 60, 130, 80, 7, 5.5),
    ],
  }),
);

add(
  "oggi-giorno-passato",
  "Giorno diverso da oggi: titolo col nome del giorno, tasto 'Oggi' e frecce.",
  "2026-01-08",
  data({
    settings: { weightKg: 100 },
    meals: [meal("2026-01-06", "pranzo", "Insalata di farro", 600, 20, 85, 18, 11, 1.5)],
  }),
  { percorso: "/?d=2026-01-06" },
);

for (const s of scenarios) writeFileSync(path.join(dir, `${s.id}.json`), JSON.stringify(s, null, 2) + "\n");
console.log(`${scenarios.length} scenari scritti in ${dir}`);
