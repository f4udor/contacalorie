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
  const newPage = async (url, data, height = 844) => {
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
    }, new Date(`${TODAY}T09:00:00+01:00`).getTime());
    await context.addInitScript(([k, v]) => localStorage.setItem(k, v), ["personal-health:v1", JSON.stringify(data)]);
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

  await browser.close();
} finally {
  stop();
}
if (failed) {
  console.log(`\n${failed} controlli falliti.`);
  process.exitCode = 1;
}
