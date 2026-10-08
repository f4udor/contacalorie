// Prova del gesto "scorri a sinistra" con il tocco simulato di Playwright (eventi touch veri del browser).
// Uso: npm run prova-scorrimento   (costruisce l'app e la avvia; con SCREENS_URL usa un server già attivo)
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const PORT = Number(process.env.SCREENS_PORT ?? 3124);
const BASE = process.env.SCREENS_URL ?? `http://localhost:${PORT}`;
const fixture = JSON.parse(readFileSync(path.join(root, "tests/fixtures/oggi-scorrimento-aperto.json"), "utf8"));
const data = { ...fixture.dati, settings: { ...fixture.dati.settings, onboardingDone: true } };

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
  const newPage = async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, locale: "it-IT", timezoneId: "Europe/Rome" });
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
    }, new Date("2026-01-08T09:00:00+01:00").getTime());
    await context.addInitScript(([k, v]) => localStorage.setItem(k, v), ["personal-health:v1", JSON.stringify(data)]);
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    return page;
  };
  const touch = async (page, text, dx, dy = 0) => {
    const loc = page.getByText(text, { exact: true }).first();
    await loc.scrollIntoViewIfNeeded();
    const box = await loc.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const cdp = await page.context().newCDPSession(page);
    const send = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    await send("touchStart", [{ x, y }]);
    for (let i = 1; i <= 8; i++) {
      await send("touchMove", [{ x: x + (dx * i) / 8, y: y + (dy * i) / 8 }]);
      await page.waitForTimeout(16);
    }
    await send("touchEnd", []);
    await cdp.detach();
    await page.waitForTimeout(350);
  };
  const open = (page) => page.evaluate(() => [...document.querySelectorAll("[data-swipe-row]")].filter((e) => e.dataset.open === "true").length);
  const rowOpen = (page, text) => page.evaluate((t) => [...document.querySelectorAll("[data-swipe-row]")].find((e) => e.textContent.includes(t))?.dataset.open === "true", text);
  const dialog = (page) => page.getByRole("dialog").isVisible().catch(() => false);

  // 1. Scorrimento a sinistra: la riga si apre e i pulsanti sono grandi almeno 44 px.
  let page = await newPage();
  await touch(page, "Pasta al pomodoro", -140);
  check("scorrendo a sinistra la riga si apre", await rowOpen(page, "Pasta al pomodoro"));
  const sizes = await page.evaluate(() => [...document.querySelectorAll('[data-swipe-row][data-open="true"] button')].filter((b) => b.getAttribute("aria-label")?.startsWith("Elimina") || b.textContent === "Preferiti").map((b) => [b.getBoundingClientRect().width, b.getBoundingClientRect().height]));
  check("«Preferiti» e il cestino sono visibili e grandi almeno 44 px", sizes.length === 2 && sizes.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(sizes));

  // 2. Una sola riga aperta alla volta.
  await touch(page, "Frittata con zucchine", -140);
  check("aprendo una seconda riga la prima si richiude", (await open(page)) === 1 && (await rowOpen(page, "Frittata con zucchine")));

  // 3. Un tocco altrove richiude.
  await page.mouse.click(200, 60);
  await page.waitForTimeout(350);
  check("un tocco altrove richiude la riga", (await open(page)) === 0);
  await page.context().close();

  // 4. Verso destra non succede nulla.
  page = await newPage();
  await touch(page, "Pasta al pomodoro", 140);
  check("scorrendo verso destra non si apre nulla", (await open(page)) === 0);
  await page.context().close();

  // 5. Lo scorrimento verticale della pagina non si blocca e non apre la riga.
  page = await newPage();
  const before = await page.evaluate(() => window.scrollY);
  await touch(page, "Pasta al pomodoro", 10, -300);
  const after = await page.evaluate(() => window.scrollY);
  check("lo scorrimento verticale muove la pagina", after > before, `scrollY ${before} → ${after}`);
  check("e non apre nessuna riga", (await open(page)) === 0);
  await page.context().close();

  // 6. Il tocco sulla riga fa quello che fa oggi (apre il piatto da modificare).
  page = await newPage();
  await page.getByText("Pasta al pomodoro", { exact: true }).first().click();
  await page.waitForTimeout(400);
  check("il tocco sulla riga apre ancora il pannello del piatto", await dialog(page));
  await page.context().close();

  // 7. Il tocco sulla riga aperta la richiude senza aprire il pannello.
  page = await newPage();
  await touch(page, "Pasta al pomodoro", -140);
  await page.getByText("Pasta al pomodoro", { exact: true }).first().click({ force: true });
  await page.waitForTimeout(400);
  check("toccare la riga aperta la richiude", (await open(page)) === 0);
  check("senza aprire il pannello", !(await dialog(page)));
  await page.context().close();

  // 8. Il cestino elimina subito, senza conferma.
  page = await newPage();
  await touch(page, "Pasta al pomodoro", -140);
  await page.getByRole("button", { name: "Elimina Pasta al pomodoro", exact: true }).click();
  await page.waitForTimeout(500);
  check("il cestino elimina subito, senza conferma", (await page.getByText("Pasta al pomodoro", { exact: true }).count()) === 0 && !(await dialog(page)));
  await page.context().close();

  // 9. «Preferiti» salva il piatto.
  page = await newPage();
  await touch(page, "Pasta al pomodoro", -140);
  await page.getByRole("button", { name: "Preferiti", exact: true }).filter({ visible: true }).click();
  await page.waitForTimeout(500);
  check("«Preferiti» salva il piatto e lo dice", await page.getByText("Salvato nei preferiti.").isVisible());
  check("e la riga si richiude", (await open(page)) === 0);
  await page.context().close();

  await browser.close();
} finally {
  stop();
}
if (failed) {
  console.log(`\n${failed} controlli falliti.`);
  process.exitCode = 1;
}
