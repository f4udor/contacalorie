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

for (const s of scenarios) writeFileSync(path.join(dir, `${s.id}.json`), JSON.stringify(s, null, 2) + "\n");
console.log(`${scenarios.length} scenari scritti in ${dir}`);
