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
const data = (parts = {}) => ({ version: 1, settings: {}, meals: [], activity: [], weighIns: [], ...parts });

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
const apri = { clickRole: { role: "button", name: "Aggiungi", exact: true } };
add("pannello-pasto-vuoto", "Inserimento manuale: modulo vuoto, solo le kcal sono obbligatorie.", "2026-01-08", giornoPasti({ meals: [] }), { fisso: true, passi: [apri, { click: "Piatto a mano" }] });
add("pannello-pasto-errori", "Inserimento manuale: kcal mancanti e un numero non valido, nessun salvataggio.", "2026-01-08", giornoPasti({ meals: [] }), {
  fisso: true,
  passi: [apri, { click: "Piatto a mano" }, { fill: ["Proteine (g)", "venti"] }, { clickRole: { role: "button", name: "Aggiungi piatto" } }],
});
add("pannello-pasto-compilato", "Inserimento manuale compilato, con la fascia Colazione.", "2026-01-08", giornoPasti({ meals: [] }), {
  fisso: true,
  passi: [apri, { click: "Piatto a mano" }, { fill: ["Nome", "Toast e caffè"] }, { click: "Colazione" }, { fill: ["Kcal", "420"] }, { fill: ["Proteine (g)", "18,5"] }, { fill: ["Carboidrati (g)", "52"] }],
});
add("pannello-libero-usato", "La settimana ha già un pasto libero: l'interruttore è disattivato e spiega perché.", "2026-01-08", giornoPasti({ meals: [meal("2026-01-06", "cena", "Pizza", 1100, 40, 130, 42, 6, 4.2, { isFree: true })] }), {
  fisso: true,
  passi: [apri, { click: "Piatto a mano" }, { scrollTo: "Pasto libero" }],
});
add("pannello-modifica", "Modifica di un pasto già inserito.", "2026-01-08", giornoPasti(), { fisso: true, passi: [{ click: "Pasta al pomodoro" }] });
add("pannello-modifica-libero", "Modifica del pasto libero: l'interruttore resta attivo, è proprio quello della settimana.", "2026-01-08", giornoPasti(), {
  fisso: true,
  passi: [{ click: "Pizza al taglio" }, { scrollTo: "Pasto libero" }],
});
add("pannello-elimina", "Eliminazione: chiede conferma prima di cancellare.", "2026-01-08", giornoPasti(), { fisso: true, passi: [{ click: "Pasta al pomodoro" }, { click: "Elimina piatto" }] });
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
add("pannello-aggiungi-completo", "Pannello Aggiungi con tutte le voci: Piatto a mano, Copia da ieri, Attività a mano, Pesata.", "2026-01-08", null, { fisso: true, passi: [apri] });
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

// --- Settimana (T2.6)
const sett = (id, descrizione, oggi, dati, extra = {}) => scenarios.push({ id, descrizione, oggi, percorso: "/settimana", dati, scorre: true, ...extra });
const settimanaCompleta = data({
  settings: { weightKg: 100 },
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
});
sett("settimana-completa", "Settimana completa: sforamento mercoledì (rosso), bici martedì, pasto libero sabato.", "2026-01-11", settimanaCompleta);
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

// --- Pasti composti da piatti (T3.2)
const q = (quantity) => ({ quantity });
const giornoPiatti = (piatti, extra = {}) => data({ settings: { weightKg: 100 }, meals: piatti, ...extra });
add("pasti-un-piatto", "Un pasto con un solo piatto (con quantità).", "2026-01-05", giornoPiatti([meal("2026-01-05", "pranzo", "Pasta al pomodoro", 650, 22, 110, 12, 6, 1.8, q("100 g"))]));
add("pasti-tre-piatti", "Un pasto con tre piatti: totale di kcal e macro in cima, piatti elencati sotto con le quantità.", "2026-01-05", giornoPiatti([
  meal("2026-01-05", "pranzo", "Riso integrale", 350, 8, 74, 3, 3, 0.1, q("100 g")),
  meal("2026-01-05", "pranzo", "Petto di pollo alla piastra", 330, 62, 0, 7, 0, 0.4, q("200 g")),
  meal("2026-01-05", "pranzo", "Zucchine e carote al vapore con un nome molto lungo per verificare che vada a capo", 90, 3, 14, 2, 5, 0.1, q("250 g")),
]));
add("pasti-libero-piu-piatti", "Cena libera di tre piatti (500, 400, 300 kcal): mangiate 1.200, nel budget 800 (caso L).", "2026-01-05", giornoPiatti([
  meal("2026-01-05", "cena", "Antipasti misti", 500, 18, 30, 34, 2, 3.1, { isFree: true, ...q("1 porzione") }),
  meal("2026-01-05", "cena", "Pizza", 400, 14, 60, 12, 3, 2.0, { isFree: true }),
  meal("2026-01-05", "cena", "Tiramisù", 300, 6, 34, 15, 0, 0.2, { isFree: true }),
]));
add("pasti-quattro", "Giornata con tutti e quattro i pasti.", "2026-01-05", giornoPiatti([
  meal("2026-01-05", "colazione", "Latte", 120, 8, 12, 4, 0, 0.2, q("250 ml")),
  meal("2026-01-05", "colazione", "Biscotti", 180, 3, 30, 6, 1, 0.3, q("4")),
  meal("2026-01-05", "pranzo", "Pasta al pomodoro", 650, 22, 110, 12, 6, 1.8, q("100 g")),
  meal("2026-01-05", "spuntino", "Yogurt greco", 150, 15, 8, 5, 0, 0.2, q("170 g")),
  meal("2026-01-05", "cena", "Salmone al forno", 420, 40, 0, 28, 0, 0.9, q("180 g")),
  meal("2026-01-05", "cena", "Insalata", 60, 2, 8, 2, 3, 0.2),
]));
const pranzo2 = giornoPiatti([
  meal("2026-01-05", "pranzo", "Pasta al pomodoro", 650, 22, 110, 12, 6, 1.8, q("100 g")),
  meal("2026-01-05", "pranzo", "Pane", 150, 5, 30, 1, 2, 0.8, q("50 g")),
]);
add("pannello-aggiungi-piatto", "'Aggiungi piatto' dentro il pranzo: la fascia è già scelta e non si chiede.", "2026-01-05", pranzo2, { fisso: true, passi: [{ click: "+ Aggiungi piatto" }] });
add("dopo-aggiungi-piatto", "Dopo aver aggiunto 'Insalata' (80 kcal, 150 g) al pranzo: il totale del pasto passa da 800 a 880 kcal.", "2026-01-05", pranzo2, {
  passi: [{ click: "+ Aggiungi piatto" }, { fill: ["Nome del piatto", "Insalata"] }, { fill: ["Quantità", "150 g"] }, { fill: ["Kcal", "80"] }, { click: "Aggiungi piatto", exact: true }, { wait: 600 }],
});
add("pannello-aggiungi-piatto-libero", "Aggiungere un piatto a un pasto libero: l'interruttore è già attivo e vale per tutto il pasto.", "2026-01-05", giornoPiatti([
  meal("2026-01-05", "cena", "Pizza", 900, 30, 120, 30, 5, 3.5, { isFree: true }),
]), { fisso: true, passi: [{ click: "+ Aggiungi piatto" }, { scrollTo: "Pasto libero" }] });
add("pannello-piatto-generale-pasto-libero", "Dal + generale, scegliendo la cena che è già un pasto libero: l'interruttore si accende da solo, così il piatto non toglie il segno al pasto.", "2026-01-05", giornoPiatti([
  meal("2026-01-05", "cena", "Pizza", 900, 30, 120, 30, 5, 3.5, { isFree: true }),
]), { fisso: true, passi: [apri, { click: "Piatto a mano" }, { clickRole: { role: "radio", name: "Cena" } }, { scrollTo: "Pasto libero" }] });
add("dopo-pasto-libero", "Pasto libero attivato sul pranzo di due piatti: l'etichetta e il tetto valgono per tutto il pasto (800 su 800 kcal).", "2026-01-05", pranzo2, {
  passi: [{ click: "Pasta al pomodoro" }, { clickRole: { role: "switch", name: "Pasto libero" } }, { click: "Salva", exact: true }, { wait: 600 }],
});
add("pannello-pasto-libero-bloccato", "Un altro pasto della settimana è già libero: l'interruttore è spento e spiega perché.", "2026-01-07", giornoPiatti([
  meal("2026-01-06", "cena", "Pizza", 1100, 40, 130, 42, 6, 4.2, { isFree: true }),
  meal("2026-01-07", "pranzo", "Riso", 400, 8, 80, 3, 2, 0.2),
]), { fisso: true, passi: [{ click: "+ Aggiungi piatto" }, { scrollTo: "Pasto libero" }] });

// --- Accesso con email e codice (T3.4): schermate con l'accesso dimostrativo (senza Supabase)
const accesso = (id, descrizione, passi, extra = {}) =>
  scenarios.push({ id, descrizione, oggi: "2026-01-08", percorso: "/", dati: null, accessoDimostrativo: { session: null }, fisso: true, passi, ...extra });
const mail = { fill: ["Email", "mauro@esempio.it"] };
const inviaCodice = { click: "Invia il codice", exact: true };
accesso("accesso-email", "Accedi: prima si scrive l'email, niente password.", []);
accesso("accesso-email-errore", "Email non valida: messaggio accanto al campo.", [{ fill: ["Email", "non-una-email"] }, inviaCodice]);
accesso("accesso-codice", "Dopo aver chiesto il codice: si inserisce il codice di 6 cifre ricevuto per email.", [mail, inviaCodice]);
accesso("accesso-codice-errore", "Codice sbagliato: messaggio chiaro, si può riprovare o chiedere un nuovo codice.", [mail, inviaCodice, { fill: ["Codice", "000000"] }, { clickRole: { role: "button", name: "Accedi", exact: true } }]);
accesso("accesso-effettuato", "Codice giusto (123456 nella modalità dimostrativa): si entra in Oggi, con la barra in basso.", [mail, inviaCodice, { fill: ["Codice", "123456"] }, { clickRole: { role: "button", name: "Accedi", exact: true } }, { wait: 600 }], { fisso: false, scorre: true });
scenarios.push({ id: "impostazioni-account", descrizione: "Impostazioni con l'accesso attivo: in fondo l'account con l'email e 'Esci'.", oggi: "2026-01-08", percorso: "/impostazioni", dati: null, scorre: true, accessoDimostrativo: { session: { email: "mauro@esempio.it" } }, passi: [{ scrollTo: "Esci" }] });
scenarios.push({ id: "dopo-esci", descrizione: "Dopo 'Esci': si torna alla schermata Accedi.", oggi: "2026-01-08", percorso: "/impostazioni", dati: null, fisso: true, accessoDimostrativo: { session: { email: "mauro@esempio.it" } }, passi: [{ clickRole: { role: "button", name: "Esci", exact: true } }, { wait: 500 }] });

// --- Esportazione (T3.6)
const datiImportBase = () => ({ ...settimanaCompleta, weighIns: [{ date: "2026-01-05", weightKg: 93 }, { date: "2026-01-09", weightKg: 92 }] });
const dati = (id, descrizione, dati, passi, extra = {}) =>
  scenarios.push({ id, descrizione, oggi: "2026-01-11", percorso: "/impostazioni", dati, scorre: true, passi, ...extra });
dati("impostazioni-dati", "Impostazioni → Dati: i due pulsanti di esportazione (con dati sul dispositivo).", datiImportBase(), [{ scrollTo: "Esporta i piatti" }]);
dati("esporta-piatti", "Dopo 'Esporta i piatti': il file CSV viene scaricato e la pagina dice quale e quanti piatti.", datiImportBase(), [{ click: "Esporta i piatti (CSV)" }, { wait: 600 }, { scrollTo: "Scaricato" }]);
dati("esporta-pesate", "Dopo 'Esporta pesate e attività': file e numero di giorni.", datiImportBase(), [{ click: "Esporta pesate e attività (CSV)" }, { wait: 600 }, { scrollTo: "Scaricato" }]);
dati("esporta-vuoto", "Senza dati: il pulsante lo dice invece di scaricare un file vuoto.", null, [{ click: "Esporta i piatti (CSV)" }, { wait: 400 }, { scrollTo: "Non ci sono ancora" }]);

// --- Importazione dei dati del dispositivo (T3.5): accesso dimostrativo + dati nel browser
const datiImport = { ...settimanaCompleta, weighIns: [{ date: "2026-01-05", weightKg: 93 }, { date: "2026-01-09", weightKg: 92 }] };
const importa = (id, descrizione, passi, extra = {}) =>
  scenarios.push({ id, descrizione, oggi: "2026-01-11", percorso: "/", dati: datiImport, accessoDimostrativo: { session: { email: "mauro@esempio.it" } }, fisso: true, passi, ...extra });
const btn = (name) => ({ clickRole: { role: "button", name, exact: true } });
importa("importa-proposta", "Primo accesso con dati su questo dispositivo: l'app propone di importarli, con quanti giorni, piatti e pesate.", []);
importa("importa-fatto", "Dopo 'Importa': riepilogo di cosa è stato aggiunto; i dati restano anche sul dispositivo finché non si conferma.", [btn("Importa"), { wait: 800 }]);
importa("importa-conferma", "Prima di togliere i dati dal dispositivo chiede conferma e dice che restano nell'account.", [btn("Importa"), { wait: 800 }, btn("Tutto a posto: togli i dati da questo dispositivo")]);
importa("importa-dopo-togli", "Dopo aver tolto i dati dal dispositivo: nessuna nuova proposta (qui l'app mostra il giorno vuoto perché in questa prova l'archivio dell'account è finto).", [btn("Importa"), { wait: 800 }, btn("Tutto a posto: togli i dati da questo dispositivo"), btn("Togli da questo dispositivo"), { wait: 600 }], { fisso: false, scorre: true });
importa("importa-in-impostazioni", "Dopo 'Più tardi' la voce resta in Impostazioni → Dati, finché ci sono dati da importare.", [btn("Più tardi"), { wait: 400 }, { scrollTo: "Importa i dati di questo dispositivo" }], { percorso: "/impostazioni", fisso: false, scorre: true });
importa("importa-pasti-misti", "Pasto con un piatto libero e uno normale insieme (salvati prima dei pasti composti): avviso che il pasto libero ora vale per tutti i piatti.", [], {
  dati: data({ meals: [meal("2026-01-05", "pranzo", "Pizza", 900, 30, 120, 30, 5, 3.5, { isFree: true }), meal("2026-01-05", "pranzo", "Insalata", 100, 2, 8, 6, 3, 0.3)] }),
});

// --- Errori di salvataggio (T3.3)
add("salvataggio-fallito", "Il browser non riesce più a scrivere (memoria piena): il peso resta in memoria (proteine 125 g) e l'avviso in cima dice che non è stato salvato su questo dispositivo. Con Supabase lo stesso avviso compare per un salvataggio non riuscito e il pannello resta aperto per riprovare.", "2026-01-08", null, {
  fisso: true, scritturaFallita: true,
  passi: [apri, { click: "Pesata", exact: true }, { fill: ["Peso (kg)", "90"] }, { click: "Salva pesata" }, { wait: 500 }],
});

// --- Inserimento con l'AI (T4.2): le risposte del server sono finte (`ai`), nessuna rete
const dish = (name, quantity, assumed, kcal, p, c, f, fi, salt, note = "") => ({ name, quantity, quantityAssumed: assumed, kcal, protein: p, carbs: c, fat: f, fiber: fi, salt, note });
const prop = (...meals) => ({ stato: 200, corpo: { proposal: { meals }, originalText: "testo" } });
const cena = { slot: "cena", dishes: [dish("Anelli di totano", "150 g", true, 280, 22, 18, 14, 1, 1.4, "Ho ipotizzato 150 g di totano fritto."), dish("Insalata di pomodorini", "1 ciotola", true, 60, 2, 8, 2, 3, 0.1, "Una ciotola piccola con un filo d'olio.")] };
const colPranzo = [{ slot: "colazione", dishes: [dish("Cappuccino", "1 tazza", true, 90, 5, 8, 4, 0, 0.1), dish("Cornetto", "1", true, 300, 6, 38, 14, 1, 0.5)] }, { slot: "pranzo", dishes: [dish("Panino con prosciutto", "1", true, 420, 20, 50, 14, 3, 2.2, "Panino da 100 g con 40 g di prosciutto.")] }];
const scrivi = (t) => ({ fill: ["Cosa hai mangiato?", t] });
const stima = btn("Stima");
const aiScen = (id, descrizione, ai, passi, extra = {}) => add(id, descrizione, "2026-01-08", giornoPasti({ meals: [] }), { fisso: true, ai, passi: [apri, ...passi], ...extra });
aiScen("ai-vuoto", "Pannello Aggiungi con la stima attiva: campo 'Cosa hai mangiato?' con il suggerimento del microfono, Stima disattivata finché il campo è vuoto.", { risposte: [] }, []);
aiScen("ai-non-disponibile", "AI non configurata: avviso 'Stima automatica non disponibile', il testo scritto resta e Stima è disattivata; le altre voci funzionano.", { disponibile: false, risposte: [] }, [scrivi("pasta al pomodoro")]);
aiScen("ai-caricamento", "Durante la stima: pulsante 'Sto stimando…' disattivato, testo conservato.", { risposte: [{ ritardo: 8000, ...prop(cena) }] }, [scrivi("anelli di totano e un'insalata di pomodorini"), stima, { wait: 500 }]);
aiScen("ai-proposta-due-piatti", "Proposta con due piatti nel pasto Cena: quantità con etichetta 'ipotizzata', note, numeri modificabili, 'Togli' per piatto.", { risposte: [prop(cena)] }, [scrivi("anelli di totano e un'insalata di pomodorini"), stima, { wait: 600 }]);
aiScen("ai-proposta-conferma", "Fondo della proposta: Correggi, Rifai la stima, Conferma, Annulla.", { risposte: [prop(cena)] }, [scrivi("anelli di totano e un'insalata di pomodorini"), stima, { wait: 600 }, { scrollTo: "Annulla" }]);
aiScen("ai-proposta-due-pasti", "Una frase con due pasti: Colazione (due piatti) e Pranzo, con la fascia modificabile.", { risposte: [prop(...colPranzo)] }, [scrivi("a colazione un cappuccino e un cornetto e a pranzo un panino con prosciutto"), stima, { wait: 600 }]);
aiScen("ai-proposta-tolto-piatto", "Dopo aver tolto il cornetto: resta il cappuccino e il pranzo.", { risposte: [prop(...colPranzo)] }, [scrivi("a colazione un cappuccino e un cornetto e a pranzo un panino con prosciutto"), stima, { wait: 600 }, { clickRole: { role: "button", name: "Togli Cornetto" } }]);
aiScen("ai-correzione", "Dopo la correzione 'il totano era di più': la stima è rifatta (totano 300 g, 560 kcal, quantità non più ipotizzata).", { risposte: [prop(cena), prop({ slot: "cena", dishes: [dish("Anelli di totano", "300 g", false, 560, 44, 36, 28, 2, 2.8), cena.dishes[1]] })] }, [scrivi("anelli di totano e un'insalata di pomodorini"), stima, { wait: 600 }, { fill: ["Correggi", "il totano era di più"] }, btn("Rifai la stima"), { wait: 600 }]);
aiScen("ai-errore-numero", "Kcal svuotate prima di confermare: errore accanto al campo, nulla è salvato.", { risposte: [prop({ slot: "pranzo", dishes: [dish("Pasta al pomodoro", "80 g", true, 420, 14, 80, 6, 5, 1.2)] })] }, [scrivi("pasta al pomodoro"), stima, { wait: 600 }, { fill: ["Kcal", ""] }, btn("Conferma"), { wait: 300 }]);
aiScen("ai-errore-rete", "Servizio non raggiungibile: messaggio chiaro, il testo scritto resta.", { risposte: [{ stato: 502, corpo: { error: { code: "rete", message: "Non riesco a raggiungere il servizio di stima: controlla la connessione e riprova." } } }] }, [scrivi("una pera"), stima, { wait: 500 }]);
aiScen("ai-limite", "Limite giornaliero raggiunto: messaggio chiaro, il testo resta.", { risposte: [{ stato: 429, corpo: { error: { code: "limite", message: "Hai raggiunto il limite di stime di oggi. Riprova domani o inserisci i numeri a mano." } } }] }, [scrivi("una pera"), stima, { wait: 500 }]);
aiScen("ai-risposta-non-valida", "Risposta del modello non utilizzabile: messaggio chiaro, nulla salvato.", { risposte: [{ stato: 502, corpo: { error: { code: "non-valida", message: "La stima ricevuta non è utilizzabile. Riprova, magari con parole diverse." } } }] }, [scrivi("una pera"), stima, { wait: 500 }]);
add("ai-dopo-conferma", "Dopo Conferma: i due piatti sono nel pasto Cena di oggi (con totale), il pannello è chiuso.", "2026-01-08", giornoPasti({ meals: [] }), {
  ai: { risposte: [prop(cena)] },
  passi: [apri, scrivi("anelli di totano e un'insalata di pomodorini"), stima, { wait: 600 }, btn("Conferma"), { wait: 700 }],
});

// --- Impostazioni (T2.7)
const imp = (id, descrizione, oggi, dati, extra = {}) => scenarios.push({ id, descrizione, oggi, percorso: "/impostazioni", dati, scorre: true, ...extra });
const salva = { click: "Salva", exact: true };
imp("impostazioni-predefinite", "Nessuna impostazione salvata: i campi sono vuoti e mostrano i valori predefiniti; senza peso la formula chiede il peso.", "2026-01-08", null);
imp("impostazioni-compilate", "Profilo, proteine manuali (150 g) con la formula visibile e 'Torna alla formula', altre regole cambiate.", "2026-01-08", data({
  settings: { weightKg: 92.5, heightCm: 178, ageYears: 41, targetWeightKg: 82, baseKcal: 2000, floorKcal: 1700, proteinGramsManual: 150, margin: 0.12, bonusShare: 0.4, kcalPerStep: 0.04, freeMealCap: 900 },
}));
imp("impostazioni-errori", "Valori non validi: errori accanto ai campi, nulla viene salvato.", "2026-01-08", null, {
  passi: [{ fill: ["Peso (kg)", "novanta"] }, { fill: ["Età (anni)", "40,5"] }, { fill: ["Kcal base", "-5"] }, { fill: ["Margine dei semafori (%)", "80"] }, { fill: ["Soglia passi", "tanti"] }, { fill: ["Tetto di kcal", "-1"] }, salva, { scrollTo: "Controlla i campi" }],
});
imp("impostazioni-salvato", "Dopo aver salvato peso 92 kg: messaggio 'Salvato.' e la formula propone 130 g di proteine.", "2026-01-08", null, {
  passi: [{ fill: ["Peso (kg)", "92"] }, salva, { wait: 500 }, { scrollTo: "Salvato." }],
});
imp("impostazioni-ripristina", "Ripristina valori predefiniti: chiede conferma e dice cosa resta.", "2026-01-08", data({ settings: { weightKg: 92.5, baseKcal: 2000, margin: 0.12 } }), {
  fisso: true,
  passi: [{ click: "Ripristina valori predefiniti" }],
});
imp("impostazioni-dopo-ripristino", "Dopo il ripristino: regole di nuovo vuote (predefinite), peso del profilo mantenuto.", "2026-01-08", data({ settings: { weightKg: 92.5, baseKcal: 2000, margin: 0.12 } }), {
  passi: [{ click: "Ripristina valori predefiniti" }, { clickRole: { role: "button", name: "Ripristina", exact: true } }, { wait: 500 }],
});
add("dopo-kcal-base", "Kcal base cambiata a 2.000 nelle Impostazioni: Oggi mostra obiettivo 2.000.", "2026-01-08", null, {
  percorso: "/impostazioni",
  passi: [{ fill: ["Kcal base", "2000"] }, salva, { wait: 500 }, { click: "Oggi", exact: true }, { wait: 500 }],
});
// Toglie gli scenari non più definiti qui.
for (const f of readdirSync(dir)) if (f.endsWith(".json")) rmSync(path.join(dir, f));
for (const s of scenarios) writeFileSync(path.join(dir, `${s.id}.json`), JSON.stringify(s, null, 2) + "\n");
console.log(`${scenarios.length} scenari scritti in ${dir}`);
