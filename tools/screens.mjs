// Genera gli screenshot delle schermate da scenari in tests/fixtures/*.json.
// Uso: npm run screens [-- --only <id>] [-- --width 390,375,430] [-- --out docs/screenshots]
// Per ogni scenario e per tema chiaro e scuro salva <id>-<chiaro|scuro>[-<larghezza>].png
// e segnala scorrimento orizzontale e aree toccabili sotto i 44 px.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const only = opt("only", null);
const widths = opt("width", "390").split(",").map(Number);
const outDir = opt("out", "docs/screenshots");
const PORT = Number(process.env.SCREENS_PORT ?? 3123);
const BASE = process.env.SCREENS_URL ?? `http://localhost:${PORT}`;
const STORAGE_KEY = "personal-health:v1";
const HEIGHT = 844;
const root = process.cwd();
const fixturesDir = path.join(root, "tests/fixtures");

async function waitForServer(url, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Il server non risponde su ${url}`);
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: "inherit", cwd: root });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${cmdArgs.join(" ")} ha fallito`))));
  });
}

function findChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const fallback = "/opt/pw-browsers/chromium";
  return existsSync(fallback) ? fallback : undefined;
}

let server = null;
if (!process.env.SCREENS_URL) {
  const busy = await fetch(BASE).then(() => true, () => false);
  if (busy) throw new Error(`La porta ${PORT} è già occupata da un altro server: fermalo o usa SCREENS_PORT.`);
  const nextBin = path.join(root, "node_modules/next/dist/bin/next");
  await run("node", [nextBin, "build"]);
  server = spawn("node", [nextBin, "start", "-p", String(PORT)], { cwd: root, stdio: "ignore" });
}
const stop = () => server?.kill("SIGTERM");
process.on("exit", stop);

let problems = 0;
try {
  await waitForServer(BASE);
  const browser = await chromium.launch({ executablePath: findChromium() });
  mkdirSync(path.join(root, outDir), { recursive: true });
  // Rigenerazione completa: via gli screenshot di scenari che non esistono più.
  if (!only && widths.length === 1 && widths[0] === 390) {
    for (const f of readdirSync(path.join(root, outDir))) if (f.endsWith(".png")) rmSync(path.join(root, outDir, f));
  }

  const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json")).sort();
  for (const file of files) {
    const sc = JSON.parse(readFileSync(path.join(fixturesDir, file), "utf8"));
    if (only && sc.id !== only) continue;
    for (const width of widths) {
      for (const [scheme, label] of [["light", "chiaro"], ["dark", "scuro"]]) {
        const context = await browser.newContext({
          viewport: { width, height: HEIGHT },
          colorScheme: scheme,
          locale: "it-IT",
          timezoneId: "Europe/Rome",
          deviceScaleFactor: 1,
          hasTouch: true,
        });
        // Data fissa: solo Date, senza toccare timer e animazioni.
        await context.addInitScript((fixed) => {
          const RealDate = Date;
          class FixedDate extends RealDate {
            constructor(...a) {
              if (a.length === 0) super(fixed);
              else super(...a);
            }
            static now() {
              return fixed;
            }
          }
          globalThis.Date = FixedDate;
        }, new Date(`${sc.oggi}T09:00:00+01:00`).getTime());
        if (sc.dati) {
          await context.addInitScript(
            ([key, data]) => {
              if (!localStorage.getItem(key)) localStorage.setItem(key, data);
            },
            [STORAGE_KEY, typeof sc.dati === "string" ? sc.dati : JSON.stringify(sc.dati)],
          );
        }
        const page = await context.newPage();
        await page.goto(BASE + (sc.percorso ?? "/"), { waitUntil: "networkidle" });
        for (const step of sc.passi ?? []) {
          if (step.click) await page.getByText(step.click, { exact: step.exact ?? true }).first().click();
          else if (step.clickRole) await page.getByRole(step.clickRole.role, { name: step.clickRole.name, exact: step.clickRole.exact }).first().click();
          else if (step.fill) await page.getByLabel(step.fill[0]).fill(step.fill[1]);
          else if (step.press) await page.keyboard.press(step.press);
          else if (step.scrollTo) await page.getByText(step.scrollTo).first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(step.wait ?? 350);
        }
        // La pagina intera in una sola immagine, con la barra in basso al suo posto.
        // Con "fisso" (pannelli aperti) resta la finestra di 390×844, come sul telefono.
        const full = sc.fisso ? HEIGHT : await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width, height: Math.max(HEIGHT, full) });
        await page.waitForTimeout(150);
        const suffix = width === 390 ? "" : `-${width}`;
        const name = `${sc.id}-${label}${suffix}.png`;
        await page.screenshot({ path: path.join(root, outDir, name) });

        const report = await page.evaluate(() => {
          const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const small = [...document.querySelectorAll("a, button, input, select, textarea, [role=button], [role=switch]")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const s = getComputedStyle(el);
              return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && (r.width < 44 || r.height < 44);
            })
            .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
          return { overflowX, small };
        });
        const notes = [];
        if (full > HEIGHT && !sc.scorre) notes.push(`la pagina è alta ${full} px: oltre ${HEIGHT} scorre in verticale (se è voluto, "scorre": true nello scenario)`);
        if (report.overflowX) notes.push("SCORRIMENTO ORIZZONTALE");
        if (report.small.length) notes.push(`aree toccabili < 44 px: ${report.small.join("; ")}`);
        console.log(`${notes.length ? "!!" : "ok"} ${name}${notes.length ? "  " + notes.join(" | ") : ""}`);
        if (notes.length) problems++;
        await context.close();
      }
    }
  }
  await browser.close();
} finally {
  stop();
}
if (problems) console.log(`\n${problems} screenshot con segnalazioni (vedi sopra).`);
