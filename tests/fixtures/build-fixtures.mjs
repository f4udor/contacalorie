// Genera gli scenari di dati di esempio (tests/fixtures/*.json) usati da `npm run screens`.
// Uso: node tests/fixtures/build-fixtures.mjs
// Giorni di riferimento: lunedì 2026-01-05 … domenica 2026-01-11 (giovedì = 2026-01-08).
import { readdirSync, rmSync, writeFileSync } from "node:fs";
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

// --- Pasti e pannello Aggiungi (T2.3)
const giornoPasti = (extra = {}) =>
  data({
    settings: { weightKg: 100 },
    meals: [
      meal("2026-01-08", "colazione", "Cappuccino e brioche", 320, 8, 48, 10, 1, 0.4),
      meal("2026-01-08", "pranzo", "Pasta al pomodoro", 650, 22, 110, 12, 6, 1.8),
      meal("2026-01-08", "pranzo", "Insalata mista con un nome molto lungo che deve andare a capo senza rompere nulla", 120, 3, 8, 8, 4, 0.6),
      meal("2026-01-08", "spuntino", "Pizza al taglio", 1100, 40, 130, 42, 6, 4.2, { isFree: true }),
      meal("2026-01-08", "cena", "Petto di pollo e verdure", 480, 52, 18, 20, 7, 1.4),
    ],
    ...extra,
  });
add("oggi-pasti", "Giorno con pasti in quattro fasce, uno libero (1.100 kcal, conta 800) e un nome lungo.", "2026-01-08", giornoPasti());
const apri = { clickRole: { role: "button", name: "Aggiungi" } };
add("pannello-pasto-vuoto", "Inserimento manuale: modulo vuoto, solo le kcal sono obbligatorie.", "2026-01-08", giornoPasti({ meals: [] }), { fisso: true, passi: [apri, { click: "Pasto a mano" }] });
add("pannello-pasto-errori", "Inserimento manuale: kcal mancanti e un numero non valido, nessun salvataggio.", "2026-01-08", giornoPasti({ meals: [] }), {
  fisso: true,
  passi: [apri, { click: "Pasto a mano" }, { fill: ["Proteine (g)", "venti"] }, { clickRole: { role: "button", name: "Aggiungi pasto" } }],
});
add("pannello-pasto-compilato", "Inserimento manuale compilato, con la fascia Colazione.", "2026-01-08", giornoPasti({ meals: [] }), {
  fisso: true,
  passi: [apri, { click: "Pasto a mano" }, { fill: ["Nome", "Toast e caffè"] }, { click: "Colazione" }, { fill: ["Kcal", "420"] }, { fill: ["Proteine (g)", "18,5"] }, { fill: ["Carboidrati (g)", "52"] }],
});
add("pannello-libero-usato", "La settimana ha già un pasto libero: l'interruttore è disattivato e spiega perché.", "2026-01-08", giornoPasti({ meals: [meal("2026-01-06", "cena", "Pizza", 1100, 40, 130, 42, 6, 4.2, { isFree: true })] }), {
  fisso: true,
  passi: [apri, { click: "Pasto a mano" }, { scrollTo: "Pasto libero" }],
});
add("pannello-modifica", "Modifica di un pasto già inserito.", "2026-01-08", giornoPasti(), { fisso: true, passi: [{ click: "Pasta al pomodoro" }] });
add("pannello-modifica-libero", "Modifica del pasto libero: l'interruttore resta attivo, è proprio quello della settimana.", "2026-01-08", giornoPasti(), {
  fisso: true,
  passi: [{ click: "Pizza al taglio" }, { scrollTo: "Pasto libero" }],
});
add("pannello-elimina", "Eliminazione: chiede conferma prima di cancellare.", "2026-01-08", giornoPasti(), { fisso: true, passi: [{ click: "Pasta al pomodoro" }, { click: "Elimina pasto" }] });
add("copia-ieri-vuoto", "Copia da ieri quando ieri non ci sono pasti: lo dice.", "2026-01-08", giornoPasti({ meals: [] }), { fisso: true, passi: [apri, { click: "Copia da ieri" }] });
add("copia-ieri", "Copia da ieri: i pasti di ieri (anche quello libero) tornano come pasti normali.", "2026-01-08", data({
  settings: { weightKg: 100 },
  meals: [
    meal("2026-01-07", "colazione", "Yogurt e cereali", 300, 14, 45, 7, 3, 0.3),
    meal("2026-01-07", "cena", "Pizza", 1100, 40, 130, 42, 6, 4.2, { isFree: true }),
  ],
}), { passi: [apri, { click: "Copia da ieri" }, { wait: 600 }] });

// --- Attività e pesata (T2.4)
const conAttivita = data({
  settings: { weightKg: 100 },
  meals: [meal("2026-01-05", "pranzo", "Pasta al ragù", 800, 35, 100, 25, 6, 2.2)],
  activity: [activity("2026-01-05", { steps: 9000, stepsSource: "manuale", bikeKm: 30, bikeSource: "manuale" })],
});
add("oggi-attivita", "Attività del giorno: passi e bici (km e kcal calcolate) con la fonte 'manuale'.", "2026-01-05", conAttivita);
add("oggi-attivita-salute", "Attività con kcal della bici da Salute (800 kcal): fonte 'da Salute', bonus bici 400.", "2026-01-05", data({
  settings: { weightKg: 100 },
  activity: [activity("2026-01-05", { steps: 8000, stepsSource: "salute", bikeKm: 31, bikeKcalHealth: 800, bikeSource: "salute" })],
}));
add("pannello-aggiungi-completo", "Pannello Aggiungi con tutte le voci: Pasto a mano, Copia da ieri, Attività a mano, Pesata.", "2026-01-08", null, { fisso: true, passi: [apri] });
add("pannello-attivita", "Attività a mano: modulo vuoto.", "2026-01-08", null, { fisso: true, passi: [apri, { click: "Attività a mano" }] });
add("pannello-attivita-errori", "Attività a mano con valori non validi: errori accanto ai campi.", "2026-01-08", null, {
  fisso: true,
  passi: [apri, { click: "Attività a mano" }, { fill: ["Passi", "tanti"] }, { fill: ["Km in bici", "-2"] }, { fill: ["Kcal bici", "1,5"] }, { click: "Salva attività" }],
});
add("pannello-attivita-modifica", "Modifica dell'attività già inserita (dalla scheda Attività).", "2026-01-05", conAttivita, { fisso: true, passi: [{ click: "Passi" }] });
add("pannello-pesata", "Pesata: modulo vuoto.", "2026-01-08", null, { fisso: true, passi: [apri, { click: "Pesata", exact: true }] });
add("pannello-pesata-errore", "Pesata con un valore non valido.", "2026-01-08", null, {
  fisso: true,
  passi: [apri, { click: "Pesata", exact: true }, { fill: ["Peso (kg)", "novanta"] }, { click: "Salva pesata" }],
});
add("pannello-pesata-esistente", "Seconda pesata nello stesso giorno: precompilata, e dice che sostituisce la prima.", "2026-01-08", data({ settings: { weightKg: 100 }, weighIns: [{ date: "2026-01-08", weightKg: 92.5 }] }), {
  fisso: true,
  passi: [apri, { click: "Pesata", exact: true }],
});
add("dopo-pesata", "Dopo aver salvato 90 kg da un profilo senza peso: la scheda proteine ha l'obiettivo 125 g (1,4 × 90).", "2026-01-08", null, {
  passi: [apri, { click: "Pesata", exact: true }, { fill: ["Peso (kg)", "90"] }, { click: "Salva pesata" }, { wait: 600 }],
});
add("dopo-attivita", "Dopo aver salvato 9.000 passi: obiettivo 2.175, composizione 'passi +75', scheda Attività.", "2026-01-08", null, {
  passi: [apri, { click: "Attività a mano" }, { fill: ["Passi", "9000"] }, { click: "Salva attività" }, { wait: 600 }],
});

// --- Sfida mattutina (T2.5)
const sfida = (start, extra = {}) => data({ settings: { weightKg: 100, challengeStartDate: start }, ...extra });
const voce = (date, exerciseId, status, reps = null) => ({ date, exerciseId, status, reps });
add("sfida-giorno-4", "Sfida giorno 4/30: push up 4, crunch, crunch incrociati, dead bug nuovo; uno fatto, uno saltato, uno con ripetizioni modificate.", "2026-01-08",
  sfida("2026-01-05", { challengeLog: [voce("2026-01-08", "Push up", "fatto"), voce("2026-01-08", "Crunch", "fatto", 25), voce("2026-01-08", "Crunch incrociati", "saltato")] }), { passi: [{ scrollTo: "Fermati se senti dolore" }] });
add("sfida-giorno-1", "Sfida giorno 1/30: tre esercizi, tutti nuovi, niente fatto.", "2026-01-05", sfida("2026-01-05"), { passi: [{ scrollTo: "Fermati se senti dolore" }] });
add("sfida-giorno-30", "Sfida giorno 30/30: dodici esercizi.", "2026-01-08", sfida("2025-12-10"), { passi: [{ scrollTo: "Fermati se senti dolore" }] });
add("sfida-non-iniziata", "Prima dell'inizio: messaggio con la data di partenza, nessuna lista.", "2026-01-08", sfida("2026-01-12"), { passi: [{ scrollTo: "non è ancora iniziata" }] });
add("sfida-completata", "Dopo il giorno 30: messaggio di sfida completata, nessuna lista.", "2026-01-08", sfida("2025-11-01"), { passi: [{ scrollTo: "Sfida completata" }] });
add("sfida-senza-data", "Nessuna data di inizio: invito a impostarla.", "2026-01-08", null, { passi: [{ scrollTo: "non ha una data" }] });
add("pannello-esercizio", "Esercizio toccato: ripetizioni modificabili (previste dal piano), Fatto, Salta.", "2026-01-08", sfida("2025-12-10"), { fisso: true, passi: [{ click: "Plank con tocco spalla" }] });
add("pannello-esercizio-errore", "Ripetizioni non valide: errore accanto al campo.", "2026-01-08", sfida("2025-12-10"), { fisso: true, passi: [{ click: "Plank con tocco spalla" }, { fill: ["Ripetizioni per lato", "dieci"] }, { click: "Fatto", exact: true }] });
add("pannello-esercizio-saltato", "Esercizio già saltato: compare 'Rimetti da fare'.", "2026-01-08", sfida("2026-01-05", { challengeLog: [voce("2026-01-08", "Dead bug", "saltato")] }), { fisso: true, passi: [{ click: "Dead bug", exact: false }] });
add("dopo-esercizio-fatto", "Dopo aver toccato la spunta del Crunch: 'fatti 1 su 4'.", "2026-01-08", sfida("2026-01-05"), {
  passi: [{ clickRole: { role: "checkbox", name: "Crunch: fatto" } }, { wait: 500 }, { scrollTo: "Fermati se senti dolore" }],
});

// --- Settimana (T2.6)
const sett = (id, descrizione, oggi, dati, extra = {}) => scenarios.push({ id, descrizione, oggi, percorso: "/settimana", dati, scorre: true, ...extra });
const esercizi1 = (date) => ["Push up", "Crunch", "Crunch incrociati"].map((e) => voce(date, e, "fatto"));
const settimanaCompleta = data({
  settings: { weightKg: 100, challengeStartDate: "2026-01-05" },
  meals: [
    meal("2026-01-05", "colazione", "Colazione", 350, 12, 50, 9, 3, 0.6),
    meal("2026-01-05", "pranzo", "Pranzo", 800, 40, 90, 25, 8, 2.1),
    meal("2026-01-05", "cena", "Cena", 600, 35, 60, 20, 7, 1.8),
    meal("2026-01-06", "pranzo", "Pranzo", 1100, 55, 120, 35, 9, 2.8),
    meal("2026-01-06", "cena", "Cena", 700, 40, 70, 25, 6, 2.0),
    meal("2026-01-07", "pranzo", "Pranzo", 1300, 60, 150, 40, 10, 3.0),
    meal("2026-01-07", "cena", "Cena fuori", 1950, 70, 200, 90, 8, 6.5),
    meal("2026-01-08", "pranzo", "Pranzo", 1100, 50, 120, 30, 9, 2.5),
    meal("2026-01-08", "cena", "Cena", 800, 45, 80, 28, 7, 2.2),
    meal("2026-01-09", "pranzo", "Pranzo", 1200, 55, 130, 35, 9, 2.6),
    meal("2026-01-09", "cena", "Cena", 800, 40, 85, 28, 6, 2.3),
    meal("2026-01-10", "pranzo", "Pizza", 1100, 40, 130, 42, 6, 4.2, { isFree: true }),
    meal("2026-01-10", "cena", "Cena", 900, 50, 90, 30, 8, 2.4),
    meal("2026-01-11", "pranzo", "Pranzo", 1000, 48, 110, 30, 9, 2.4),
  ],
  activity: [
    activity("2026-01-05", { steps: 8000, stepsSource: "manuale" }),
    activity("2026-01-06", { steps: 7200, stepsSource: "manuale", bikeKm: 20, bikeSource: "manuale" }),
    activity("2026-01-07", { steps: 9000, stepsSource: "manuale" }),
    activity("2026-01-09", { steps: 6500, stepsSource: "manuale" }),
  ],
  challengeLog: [...esercizi1("2026-01-05"), ...esercizi1("2026-01-06"), ...esercizi1("2026-01-07"), voce("2026-01-08", "Push up", "fatto")],
});
sett("settimana-completa", "Settimana completa: sforamento mercoledì (rosso), bici martedì, pasto libero sabato, tre giorni di sfida.", "2026-01-11", settimanaCompleta);
sett("settimana-parziale", "Settimana a metà (oggi mercoledì): giorni futuri vuoti, medie sui soli giorni con pasti.", "2026-01-07", data({
  settings: { weightKg: 100 },
  meals: [
    meal("2026-01-05", "pranzo", "Pranzo", 1750, 90, 200, 60, 20, 4),
    meal("2026-01-06", "pranzo", "Pranzo", 1800, 100, 210, 65, 22, 4),
    meal("2026-01-07", "pranzo", "Pranzo", 900, 45, 100, 30, 9, 2),
  ],
  activity: [activity("2026-01-06", { steps: 9500, stepsSource: "manuale" })],
}));
sett("settimana-vuota", "Settimana senza dati: barre vuote con i soli obiettivi, valori '–', messaggio.", "2026-01-08", null);
sett("settimana-precedente", "Settimana precedente (vuota) aperta con la freccia: compare 'Questa settimana'.", "2026-01-11", settimanaCompleta, { passi: [{ clickRole: { role: "link", name: "Settimana precedente" } }] });
sett("settimana-tocco-barra", "Toccando la barra di mercoledì si apre quel giorno in Oggi.", "2026-01-11", settimanaCompleta, { percorso: "/settimana", passi: [{ clickRole: { role: "link", name: "Mercoledì 7 gennaio" } }], scorre: true });

// Toglie gli scenari non più definiti qui.
for (const f of readdirSync(dir)) if (f.endsWith(".json")) rmSync(path.join(dir, f));
for (const s of scenarios) writeFileSync(path.join(dir, `${s.id}.json`), JSON.stringify(s, null, 2) + "\n");
console.log(`${scenarios.length} scenari scritti in ${dir}`);
