// Prova dei «Comandi fermi» (BRIEF §10.3): un comando non cambia posto quando cambia il contenuto.
// Misura la posizione verticale dei comandi passando da uno stato pieno a uno vuoto; la differenza deve essere zero.
// Uso: npm run prova-comandi   (costruisce l'app e la avvia; con SCREENS_URL usa un server già attivo)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const PORT = Number(process.env.SCREENS_PORT ?? 3125);
const BASE = process.env.SCREENS_URL ?? `http://localhost:${PORT}`;
const TODAY = "2026-01-11"; // domenica: la settimana 5-11 gennaio è tutta passata o in corso

// --- Dati: settimana A (5-11 gen) con sette giorni, B (29 dic-4 gen) con due, C (22-28 dic) vuota.
const day = (n) => `2026-01-${String(n).padStart(2, "0")}`;
const meal = (date, slot, name, kcal, extra = {}) => ({ id: `${date}-${slot}-${name}`, date, slot, name, kcal, protein: 20, carbs: 60, fat: 15, fiber: 5, salt: 1.5, isFree: false, originalText: null, ...extra });
const act = (date, a) => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null, ...a });
const weekA = [5, 6, 7, 8, 9, 10, 11].map(day);
const weekB = ["2025-12-29", "2025-12-31"];
const baseData = (extra = {}) => ({
  version: 1,
  settings: { onboardingDone: true, weightKg: 92.5, targetWeightKg: 82 },
  meals: [
    ...weekA.map((d, i) => meal(d, "pranzo", `Pranzo ${i}`, 1800 + i * 40)),
    meal(weekB[0], "pranzo", "Pranzo B", 1900),
    meal(weekB[1], "cena", "Cena B", 2100),
  ],
  activity: [
    ...weekA.map((d, i) => act(d, { steps: 6000 + i * 500, stepsSource: "salute", bikeKm: 10 + i, bikeSource: "salute", bikeKmManual: i % 2 ? 5 : null })),
    act(weekB[0], { steps: 7000, stepsSource: "salute", bikeKm: 14, bikeSource: "salute" }),
    act(weekB[1], { steps: 8000, stepsSource: "salute" }),
  ],
  weighIns: [{ date: "2026-01-02", weightKg: 92 }, { date: "2026-01-06", weightKg: 91.8 }, { date: "2026-01-08", weightKg: 91.4 }],
  ...extra,
});

const run = (cmd, args) => new Promise((res, rej) => spawn(cmd, args, { stdio: "inherit", cwd: root }).on("exit", (c) => (c === 0 ? res() : rej(new Error(`${cmd} fallito`)))));
let server = null;
if (!process.env.SCREENS_URL) {
  const nextBin = path.join(root, "node_modules/next/dist/bin/next");
  await run("node", [nextBin, "build"]);
  server = spawn("node", [nextBin, "start", "-p", String(PORT)], { cwd: root, stdio: "ignore" });
}
const stop = () => server?.kill("SIGTERM");
process.on("exit", stop);

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok" : "!!"} ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};

try {
  for (let i = 0; i < 100; i++) {
    if (await fetch(BASE).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) });
  const newPage = async (url, data, height = 844, opts = {}) => {
    const today = opts.today ?? TODAY;
    const context = await browser.newContext({ viewport: { width: 390, height }, hasTouch: true, locale: "it-IT", timezoneId: "Europe/Rome" });
    await context.addInitScript((fixed) => {
      const R = Date;
      globalThis.Date = class extends R {
        constructor(...a) {
          if (a.length === 0) super(fixed);
          else super(...a);
        }
        static now() {
          return fixed;
        }
      };
    }, new Date(`${today}T09:00:00+01:00`).getTime());
    await context.addInitScript(([k, v]) => localStorage.setItem(k, v), ["personal-health:v1", JSON.stringify(data)]);
    if (opts.ai) {
      // Stima automatica finta: risposte in ordine (l'ultima si ripete); `ritardo` = millisecondi di attesa.
      const risposte = [...opts.ai];
      await context.route("**/api/estimate", async (route) => {
        if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
        const r = risposte.length > 1 ? risposte.shift() : risposte[0];
        if (r.ritardo) await new Promise((res) => setTimeout(res, r.ritardo));
        return route.fulfill({ status: r.stato ?? 200, json: r.corpo ?? {} });
      });
    }
    const page = await context.newPage();
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    return page;
  };
  const btn = (page, name) => page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();
  /** Come `btn`, ma solo dentro il pannello aperto (dietro c'è la schermata con altri tasti dello stesso nome). */
  const inPanel = (page, name) => page.getByRole("dialog").getByRole("button", { name, exact: true }).first();
  /** Posizione verticale (alto) di un elemento sullo schermo, in pixel. */
  const topOf = async (loc) => Math.round((await loc.boundingBox()).y * 10) / 10;
  /** Differenza massima tra le misure di uno stesso comando in più stati: deve essere zero. */
  const same = (name, rows) => {
    const names = Object.keys(rows[0].pos);
    for (const n of names) {
      const values = rows.map((r) => r.pos[n]);
      check(`${name}: «${n}» ferma (${rows.map((r) => `${r.label} ${r.pos[n]}`).join(" · ")})`, Math.max(...values) - Math.min(...values) === 0);
    }
  };

  // --- T6b.0: pannelli della Settimana ad altezza stabile. Settimana piena (7 giorni), con due giorni, vuota.
  const weekPanels = [
    { panel: "Apri Passi", title: "Passi", number: /./, footer: null },
    { panel: "Apri Bici", title: "Bici", footer: "Aggiungi uscita in bici" },
    { panel: "Apri Pasto libero", title: "Pasto libero", footer: "Aggiungi pasto libero" },
  ];
  for (const height of [844, 667]) {
    for (const p of weekPanels) {
      const page = await newPage("/settimana", baseData(), height);
      await btn(page, p.panel).click();
      await page.waitForTimeout(500);
      const dialog = page.getByRole("dialog");
      const measure = async (label) => {
        const pos = {
          pannello: await topOf(dialog),
          chiudi: await topOf(inPanel(page, "Chiudi")),
          precedente: await topOf(inPanel(page, "Settimana precedente")),
          presente: await topOf(inPanel(page, "Torna a questa settimana")),
          successiva: await topOf(inPanel(page, "Settimana successiva")),
        };
        if (p.title !== "Pasto libero") pos.grafico = await topOf(dialog.locator('[aria-hidden="true"] svg').first());
        if (p.footer) pos[p.footer] = await topOf(inPanel(page, p.footer));
        const box = await dialog.boundingBox();
        return { label, pos, bottom: box.y + box.height };
      };
      const rows = [await measure("7 giorni")];
      await inPanel(page, "Settimana precedente").click();
      await page.waitForTimeout(500);
      rows.push(await measure("2 giorni"));
      await inPanel(page, "Settimana precedente").click();
      await page.waitForTimeout(500);
      rows.push(await measure("vuota"));
      same(`${p.title} a ${height} px`, rows);
      check(`${p.title} a ${height} px: il pannello sta nello schermo`, rows.every((r) => r.pos.pannello >= 0 && r.bottom <= height), JSON.stringify(rows.map((r) => [r.pos.pannello, r.bottom])));
      check(`${p.title} a ${height} px: il pannello si chiude`, await inPanel(page, "Chiudi").isVisible());
      await page.context().close();
    }
  }

  // Pannello Peso: stessa altezza degli altri (tra una pesata e nessuna).
  {
    const heights = [];
    for (const data of [baseData(), baseData({ weighIns: [] })]) {
      const page = await newPage("/settimana", data);
      await btn(page, "Apri Peso").click();
      await page.waitForTimeout(500);
      const box = await page.getByRole("dialog").boundingBox();
      heights.push(box.height);
      const p2 = { chiudi: await topOf(inPanel(page, "Chiudi")), aggiungi: await topOf(inPanel(page, "Aggiungi pesata")) };
      heights.push(p2.aggiungi);
      await page.context().close();
    }
    check(`Peso: altezza del pannello e tasto «Aggiungi pesata» uguali con e senza pesate (${heights.join(" · ")})`, heights[0] === heights[2] && heights[1] === heights[3]);
    const page = await newPage("/settimana", baseData());
    await btn(page, "Apri Passi").click();
    await page.waitForTimeout(500);
    const passi = (await page.getByRole("dialog").boundingBox()).height;
    check(`Peso: stessa altezza del pannello Passi (${heights[0]} · ${passi})`, heights[0] === passi);
    await page.context().close();
  }

  // --- T6b.1: gli altri comandi che si spostano. Ogni confronto misura gli stessi comandi in stati diversi: differenza zero.
  const byLabel = (page, label) => page.locator(`[aria-label="${label}"]`).filter({ visible: true }).first();
  const dlg = (page) => page.getByRole("dialog").last();
  const inDialog = (page, role, name) => dlg(page).getByRole(role, { name, exact: true }).first();
  const settle = (page, ms = 450) => page.waitForTimeout(ms);
  const height = async (loc) => Math.round((await loc.boundingBox()).height * 10) / 10;

  // Oggi: giorno con pasti, senza pasti, futuro. Comandi dell'intestazione e tasto +.
  {
    const rows = [];
    const calorie = [];
    for (const [label, url] of [["con pasti", "/?d=2026-01-07"], ["senza pasti", "/?d=2026-01-03"], ["futuro", "/?d=2026-01-12"]]) {
      const page = await newPage(url, baseData());
      const pos = {
        "freccia indietro": await topOf(byLabel(page, "Giorno precedente")),
        "ritorno al presente": await topOf(byLabel(page, "Torna a oggi")),
        "freccia avanti": await topOf(byLabel(page, "Giorno successivo")),
        ingranaggio: await topOf(byLabel(page, "Impostazioni")),
        "tasto +": await topOf(byLabel(page, "Aggiungi")),
        "titolo": await topOf(page.locator("h1")),
      };
      calorie.push(`${label} ${await height(page.locator("section", { has: page.getByRole("heading", { name: "Calorie", exact: true }) }).first())}`);
      rows.push({ label, pos });
      await page.context().close();
    }
    same("Oggi (giorno con pasti → senza → futuro)", rows);
    // Solo da riferire (non è un comando): la scheda Calorie cambia altezza per la riga di composizione, che il brief (§2) mostra solo se c'è qualcosa oltre alla base.
    console.log(`-- info: altezza della scheda Calorie di Oggi: ${calorie.join(" · ")}`);
  }

  // Settimana: con dati, senza dati, corrente appena iniziata (oggi lunedì 12, un solo pasto di oggi).
  {
    const rows = [];
    const casi = [
      ["con dati", "/settimana?w=2026-01-05", {}],
      ["senza dati", "/settimana?w=2025-12-22", {}],
      ["appena iniziata", "/settimana", { today: "2026-01-12" }],
    ];
    for (const [label, url, opts] of casi) {
      const data = label === "appena iniziata" ? baseData({ meals: [meal("2026-01-12", "colazione", "Cappuccino", 120)], activity: [], weighIns: [] }) : baseData();
      const page = await newPage(url, data, 844, opts);
      const pos = {
        "freccia indietro": await topOf(byLabel(page, "Settimana precedente")),
        "ritorno al presente": await topOf(byLabel(page, "Torna a questa settimana")),
        "freccia avanti": await topOf(byLabel(page, "Settimana successiva")),
        ingranaggio: await topOf(byLabel(page, "Impostazioni")),
        "scheda Calorie (altezza)": await height(page.locator("section", { has: page.getByRole("heading", { name: "Calorie", exact: true }) }).first()),
        "scheda Passi (altezza)": await height(byLabel(page, "Apri Passi")),
        "scheda Bici (altezza)": await height(byLabel(page, "Apri Bici")),
      };
      rows.push({ label, pos });
      await page.context().close();
    }
    same("Settimana (con dati → senza → corrente appena iniziata)", rows);
  }

  const proposta = { proposal: { meals: [{ slot: "cena", dishes: [{ name: "Anelli di totano", quantity: "150 g totano, 20 g farina", quantityAssumed: true, kcal: 280, protein: 22, carbs: 18, fat: 14, fiber: 1, salt: 1.4, note: "Ho ipotizzato 150 g di totano." }, { name: "Insalata di pomodorini", quantity: "200 g pomodorini", quantityAssumed: true, kcal: 60, protein: 2, carbs: 8, fat: 2, fiber: 3, salt: 0.1, note: "" }] }] }, originalText: "testo" };
  const errore = { error: { code: "limite", message: "Hai raggiunto il limite di stime di oggi. Riprova domani o inserisci i numeri a mano." } };
  const dialogPos = async (page) => ({
    pannello: await topOf(dlg(page)),
    "X": await topOf(inDialog(page, "button", "Chiudi")),
    "selettore AI": await topOf(inDialog(page, "radio", "AI")),
    "selettore Manuale": await topOf(inDialog(page, "radio", "Manuale")),
    "Salva": await topOf(inDialog(page, "button", "Salva")),
  });

  // Pannello Aggiungi (scheda del piatto in aggiunta): AI vuoto, in caricamento, proposta, errore; Manuale vuoto, stima in caricamento, errore.
  {
    const rows = [];
    const page = await newPage("/?d=2026-01-11", baseData(), 844, { ai: [{ ritardo: 1200, corpo: proposta }] });
    await byLabel(page, "Aggiungi").click();
    await settle(page);
    rows.push({ label: "AI vuoto", pos: await dialogPos(page) });
    await dlg(page).getByLabel("Cosa hai mangiato?").fill("anelli di totano e un'insalata di pomodorini");
    await inDialog(page, "button", "Stima").click();
    await settle(page, 400);
    rows.push({ label: "AI in caricamento", pos: await dialogPos(page) });
    await settle(page, 1500);
    rows.push({ label: "AI proposta", pos: await dialogPos(page) });
    await page.context().close();

    const page2 = await newPage("/?d=2026-01-11", baseData(), 844, { ai: [{ stato: 429, corpo: errore }] });
    await byLabel(page2, "Aggiungi").click();
    await settle(page2);
    await dlg(page2).getByLabel("Cosa hai mangiato?").fill("una pera");
    await inDialog(page2, "button", "Stima").click();
    await settle(page2, 700);
    rows.push({ label: "AI errore", pos: await dialogPos(page2) });
    await inDialog(page2, "radio", "Manuale").click();
    await settle(page2);
    rows.push({ label: "Manuale vuoto", pos: await dialogPos(page2) });
    await dlg(page2).getByLabel("Nome", { exact: true }).fill("Spaghetti");
    await dlg(page2).getByLabel("Quantità", { exact: true }).fill("80 g di pasta");
    await inDialog(page2, "button", "Stima con l'AI").click();
    await settle(page2, 700);
    rows.push({ label: "Manuale stima in errore", pos: await dialogPos(page2) });
    await page2.context().close();
    same("Pannello Aggiungi / scheda del piatto in aggiunta", rows);
  }

  // Scheda del piatto in modifica: Manuale ↔ AI, e stima in caricamento / errore.
  {
    const rows = [];
    const page = await newPage("/?d=2026-01-07", baseData(), 844, { ai: [{ ritardo: 1200, stato: 429, corpo: errore }] });
    await page.getByText("Pranzo 2", { exact: true }).first().click();
    await settle(page);
    rows.push({ label: "Manuale", pos: await dialogPos(page) });
    await inDialog(page, "radio", "AI").click();
    await settle(page);
    rows.push({ label: "AI", pos: await dialogPos(page) });
    await inDialog(page, "radio", "Manuale").click();
    await settle(page);
    await inDialog(page, "button", "Stima con l'AI").click();
    await settle(page, 400);
    rows.push({ label: "Manuale stima in caricamento", pos: await dialogPos(page) });
    await settle(page, 1500);
    rows.push({ label: "Manuale stima in errore", pos: await dialogPos(page) });
    await page.context().close();
    same("Scheda del piatto in modifica", rows);
  }

  // Impostazioni: elenco → pagina interna → ritorno. X nell'elenco e freccia indietro nella pagina stanno nello stesso punto.
  {
    const rows = [];
    const page = await newPage("/?d=2026-01-11", baseData());
    await byLabel(page, "Impostazioni").click();
    await settle(page);
    const lista = async () => ({ pannello: await topOf(dlg(page)), "X / indietro": await topOf(dlg(page).locator('button[aria-label="Chiudi"], button[aria-label="Indietro"]').first()) });
    rows.push({ label: "elenco", pos: await lista() });
    await dlg(page).getByRole("button", { name: /^Obiettivi/ }).click();
    await settle(page);
    rows.push({ label: "pagina Obiettivi", pos: await lista() });
    await inDialog(page, "button", "Indietro").click();
    await settle(page);
    rows.push({ label: "ritorno all'elenco", pos: await lista() });
    await dlg(page).getByRole("button", { name: /^Profilo/ }).click();
    await settle(page);
    rows.push({ label: "pagina Profilo", pos: await lista() });
    await page.context().close();
    same("Impostazioni", rows);
  }

  // T6b.5: l'etichetta delle kcal su una barra non sposta né ridimensiona nulla, resta dentro la scheda, una sola alla volta, e la tocca tutta la colonna (≥ 44 px).
  {
    const kcal = [2080, 1900, 2250, 1750, 2140, 2400, 3050];
    const data = baseData({ meals: kcal.map((k, i) => meal(day(5 + i), "pranzo", "Pranzo", k)), activity: [], weighIns: [] });
    const page = await newPage("/settimana?w=2026-01-05", data);
    const card = page.locator("section", { has: page.getByRole("heading", { name: "Calorie", exact: true }) }).first();
    const col = (name) => page.getByRole("button", { name: new RegExp(`^${name} gennaio`) }).first();
    const snap = async () => ({ card: await card.boundingBox(), saldo: await topOf(page.getByRole("heading", { name: "Saldo", exact: true })), media: await topOf(page.getByRole("heading", { name: "Media", exact: true })) });
    const before = await snap();
    const labels = () => page.locator("[data-bar-label]");
    for (const [name, text] of [["Mercoledì 7", "2.250"], ["Domenica 11", "3.050"], ["Lunedì 5", "2.080"]]) {
      await col(name).click();
      await page.waitForTimeout(150);
      const after = await snap();
      check(`barra ${name}: compare «${text}», una sola etichetta`, (await labels().count()) === 1 && (await labels().first().textContent()) === text);
      check(`barra ${name}: nulla si sposta né cambia altezza`, JSON.stringify(after) === JSON.stringify(before), JSON.stringify([before, after]));
      const l = await labels().first().boundingBox();
      check(`barra ${name}: l'etichetta sta dentro la scheda e sotto la legenda`, l.x >= before.card.x && l.x + l.width <= before.card.x + before.card.width && l.y >= (await card.locator("h2").boundingBox()).y + 20, JSON.stringify([l, before.card]));
      const c = await col(name).boundingBox();
      check(`barra ${name}: la colonna toccabile è almeno 44 px (${Math.round(c.width)}×${Math.round(c.height)})`, c.width >= 44 && c.height >= 44);
    }
    await col("Lunedì 5").click();
    check("secondo tocco sulla stessa barra: l'etichetta si toglie", (await labels().count()) === 0);
    await col("Giovedì 8").click();
    await page.mouse.click(200, 600);
    await page.waitForTimeout(150);
    check("tocco fuori dal grafico: l'etichetta si toglie", (await labels().count()) === 0);
    await page.context().close();
    const p2 = await newPage("/settimana?w=2026-01-05", baseData({ meals: [meal(day(5), "pranzo", "Pranzo", 2000)], activity: [], weighIns: [] }));
    await p2.getByRole("button", { name: /^Martedì 6 gennaio/ }).click();
    check("giorno senza pasti: nessuna etichetta", (await p2.locator("[data-bar-label]").count()) === 0);
    await p2.getByRole("button", { name: /^Lunedì 5 gennaio/ }).click();
    await byLabel(p2, "Settimana successiva").click();
    await p2.waitForTimeout(300);
    check("cambiando settimana l'etichetta sparisce", (await p2.locator("[data-bar-label]").count()) === 0);
    await p2.context().close();
  }

  await browser.close();
} finally {
  stop();
}
if (failed) {
  console.log(`\n${failed} controlli falliti.`);
  process.exitCode = 1;
}
