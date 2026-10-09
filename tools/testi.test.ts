import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx$/.test(name) ? [p] : [];
  });
}

// Solo le schermate (file .tsx di src/app): i nomi interni di dati, tipi e file CSV non sono testi dell'interfaccia.
const files = sources(path.join(root, "src/app")).map((f) => ({ file: path.relative(root, f), text: readFileSync(f, "utf8").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/\\'/g, "'").replace(/\\"/g, '"') }));

/** Le voci della colonna "Com'è" di docs/TESTI.md (senza quelle segnate †, che restano legittime altrove): come frase intera non devono comparire in nessuna schermata. */
// "libero" e "manuale" come parole sole sono anche valori interni (tipi, modalità): il testo mostrato è «Pasto libero» / «a mano», controllati dagli screenshot.
const OLD_TEXTS = [
  // Regole generali
  "Kcal", "Kcal base", "Media kcal", "Fascia", "Bici a mano", "Proteine (g)", "Peso (kg)", "Età (anni)", "Quota di bonus (%)", "Sto stimando…", "Togli",
  // Oggi
  "kcal rimaste", "kcal oltre", "Inserisci il peso", "Obiettivo dopo il peso",
  "Nessun pasto per questo giorno. Scegli una fascia o tocca +.", "Aggiungi:", "Anche:", "Tolto dai preferiti.", "Nessuna attività",
  // Aggiungi e scheda del piatto
  "Stima automatica non disponibile. Usa «Manuale».", "Nome del piatto", "Quantità (facoltativa)",
  "Le kcal sembrano basse rispetto ai nutrienti: controlla i numeri.", "Inserisci le kcal o tocca «Stima con l'AI»", "Inserisci le kcal",
  "Hai già usato il pasto libero in questa settimana: ce n'è uno solo.", "Il pasto libero di questa settimana è già stato usato", "Puoi segnare come libero un solo pasto della proposta.",
  // Preferiti
  "Carico i preferiti…", "Nessun preferito. Tocca un piatto e scegli «Salva nei preferiti», oppure tocca l'intestazione di un pasto per salvarlo intero.",
  // Uscita in bici e Pesata
  "Km in bici", "Kcal (facoltative)", "Si sommano ai km arrivati da Salute.", "Se le lasci vuote si calcolano dai km (27 kcal per km).", "Elimina la bici a mano", "Inserisci i km o le kcal",
  "Una pesata per giorno.", "Hai già una pesata per questo giorno: salvando la sostituisci.",
  // Settimana
  "di vantaggio", "Passi medi", "sui giorni con passi", "usato", "non usato", "dalla pesata precedente",
  "Pesate", "Nessuna pesata in questa settimana.", "Salva pesata", "+ A mano",
  "I passi arrivano da Salute e non si modificano. Un vecchio valore inserito a mano si può solo eliminare.",
  "Segna come libero", "Togli pasto libero", "Se lo togli il pasto resta, ma conta per intero nel budget.",
  // Impostazioni
  "Metabolismo basale", "La base del giorno non scende sotto questo valore", "Imposta questa data", "Completa il profilo per calcolare le tue kcal.", "Vai al Profilo",
  "Kcal per km in bici", "Kcal per passo", "Passi da cui si conta il bonus", "Quota di bonus (%)", "Tetto di kcal del pasto libero", "Salute collegata", "Salute non collegata",
  // Voci che il revisore ha trovato mancanti
  "Obiettivo 2.100 kcal", "Mangiate 2.061 su 2.100 kcal", "Togli Pasta al pomodoro", "Togli i dati da questo dispositivo", "Togli da questo dispositivo", "Togliere i dati?", "Tutto a posto: togli i dati da questo dispositivo",
  "Il Comando rapido smette di funzionare finché non ci incolli il nuovo codice. Rigenerare?",
  "Passi e km in bici arrivano da soli dall'iPhone con un Comando rapido. Prima crea il codice personale.",
  "Questo codice si vede solo adesso: copialo nel Comando rapido prima di chiudere.",
  "Con sesso, età, altezza e peso le kcal si calcolano da sole: puoi completarli in Impostazioni.",
  "Con questa data la base resta al minimo. Prima data possibile:", "Con la data scelta la base resta al minimo. Prima data possibile:",
  // Collegamenti
  "Ultimo invio riuscito", "Nessun invio ancora", "Crea codice", "Rigenera codice", "Rigenerare?", "Stima automatica (AI)", "non configurata", "collegata", "non collegata",
  "Senza AI puoi inserire i piatti a mano.", "Il collegamento con Salute richiede l'accesso: ora i dati sono solo su questo dispositivo.",
  // Primo avvio e accesso
  "Le tue kcal", "Kcal base calcolate", "Kcal base personalizzate", "Kcal base predefinite", "Cambia la base a mano (kcal)", "Fine",
  "Scrivi la tua email: ti mandiamo un codice di 6 cifre. Niente password.",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("docs/TESTI.md: i vecchi testi non compaiono più", () => {
  for (const phrase of OLD_TEXTS) {
    it(`«${phrase}»`, () => {
      // come testo intero: tra apici o backtick, oppure come testo di un elemento (tra > e <)
      const whole = new RegExp(`(["'\`]|>\\s*)${escape(phrase)}(["'\`]|\\s*<)`);
      const found = files.filter((f) => whole.test(f.text)).map((f) => f.file);
      expect(found).toEqual([]);
    });
  }
});

describe("docs/TESTI.md: comandi con «Togli» e frasi lunghe", () => {
  it("nessun comando o frase dell'interfaccia usa «Togli…» / «toglili» (ora «Rimuovi» o «Elimina»)", () => {
    const found = files.filter((f) => /["'`>]\s*(Togli|Togliere|toglili)\b/.test(f.text)).map((f) => f.file);
    expect(found).toEqual([]);
  });
  it("«Mangiate … su … kcal» e «nel budget» non compaiono", () => {
    const found = files.filter((f) => /Mangiate \$?\{?[^"]*su|nel budget|Obiettivo dopo/.test(f.text)).map((f) => f.file);
    expect(found).toEqual([]);
  });
});
