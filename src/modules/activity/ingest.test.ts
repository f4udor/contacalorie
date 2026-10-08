import { describe, expect, it } from "vitest";
import { createFakeHealthGate } from "./fake-gate";
import { dateInZone, handleHealthIngest, keptDays } from "./ingest";
import type { HealthBody } from "./ingest";

// Giovedì 8 ottobre 2026, 10:30 a Roma.
const NOW = new Date("2026-10-08T08:30:00Z");
const TODAY = "2026-10-08";
const YESTERDAY = "2026-10-07";

function setup() {
  const gate = createFakeHealthGate(TODAY, YESTERDAY);
  gate.codes.set("codice-uno", { user: "u1", revoked: false });
  gate.codes.set("codice-due", { user: "u2", revoked: false });
  gate.codes.set("vecchio", { user: "u1", revoked: true });
  const call = (auth: string | null, body: unknown, extra: { dailyLimit?: number } = {}) => handleHealthIngest({ gate, now: NOW, ...extra }, auth, body);
  return { gate, call };
}

describe("fuso orario", () => {
  it("oggi e ieri a Roma, non in UTC", () => {
    expect(dateInZone(new Date("2026-10-07T22:30:00Z"))).toBe("2026-10-08");
    expect(dateInZone(new Date("2026-01-07T23:30:00Z"))).toBe("2026-01-08");
    expect(keptDays(new Date("2026-03-01T10:00:00Z"))).toEqual({ today: "2026-03-01", yesterday: "2026-02-28" });
  });
});

describe("riconoscimento del codice", () => {
  const body = { passi: `${TODAY};8123` };
  it("codice valido", async () => {
    const { call } = setup();
    const out = await call("Bearer codice-uno", body);
    expect(out.status).toBe(200);
    expect(out.body.ok).toBe(true);
  });
  it("assente, sbagliato e revocato: 401 con lo stesso messaggio", async () => {
    const { call, gate } = setup();
    const outs = await Promise.all([call(null, body), call("Bearer sbagliato", body), call("Bearer vecchio", body), call("codice-uno", body)]);
    expect(outs.map((o) => o.status)).toEqual([401, 401, 401, 401]);
    expect(new Set(outs.map((o) => JSON.stringify(o.body))).size).toBe(1);
    expect(gate.activity.size).toBe(0);
  });
  it("senza Supabase l'ingresso non è disponibile", async () => {
    const out = await handleHealthIngest({ gate: null, now: NOW }, "Bearer x", body);
    expect(out.status).toBe(503);
  });
});

describe("formati", () => {
  it("testo con tutte le varianti, passi e km", async () => {
    const { call, gate } = setup();
    const out = await call("Bearer codice-uno", { passi: `${YESTERDAY},  8.123 passi\n\n08/10/2026;8123,0`, bici_km: `${TODAY};12,4 km\n${YESTERDAY}\t1.234` });
    expect(out.body.ok).toBe(true);
    expect(out.body.salvate).toEqual([
      { data: YESTERDAY, passi: 8123, bici_km: 1.23 },
      { data: TODAY, passi: 8123, bici_km: 12.4 },
    ]);
    expect(gate.activity.get(`u1|${TODAY}`)).toMatchObject({ steps: 8123, stepsSource: "salute", km: 12.4, kmSource: "salute" });
  });
  it("elenco di oggetti", async () => {
    const { call } = setup();
    const out = await call("Bearer codice-uno", { passi: [{ data: TODAY, valore: 9000 }], bici_km: [{ data: TODAY, valore: "7,25" }] });
    expect(out.body.salvate).toEqual([{ data: TODAY, passi: 9000, bici_km: 7.25 }]);
  });
  it("solo passi e solo bici", async () => {
    const { call } = setup();
    expect((await call("Bearer codice-uno", { passi: `${TODAY};100` })).body.salvate).toEqual([{ data: TODAY, passi: 100 }]);
    expect((await call("Bearer codice-uno", { bici_km: `${TODAY};5` })).body.salvate).toEqual([{ data: TODAY, bici_km: 5 }]);
  });
});

describe("righe da tenere o scartare", () => {
  it("tre giorni fa è scartata, con il motivo in italiano", async () => {
    const { call, gate } = setup();
    const out = await call("Bearer codice-uno", { passi: `2026-10-05;5000\n${TODAY};8000` });
    expect(out.body.salvate).toEqual([{ data: TODAY, passi: 8000 }]);
    expect(out.body.scartate).toEqual([{ riga: "passi: 2026-10-05;5000", motivo: "data fuori da oggi e ieri" }]);
    expect(gate.activity.has("u1|2026-10-05")).toBe(false);
  });
  it("domani è scartato", async () => {
    const { call } = setup();
    const out = await call("Bearer codice-uno", { passi: `${TODAY};8000\n2026-10-09;100` });
    expect(out.body.scartate?.map((s) => s.motivo)).toEqual(["data fuori da oggi e ieri"]);
  });
  it("tutte scartate: nessuna scrittura e ok falso", async () => {
    const { call, gate } = setup();
    const out = await call("Bearer codice-uno", { passi: `2026-10-01;5000\n${TODAY};0` });
    expect(out.status).toBe(200);
    expect(out.body.ok).toBe(false);
    expect(out.body.scartate).toHaveLength(2);
    expect(gate.activity.size).toBe(0);
    expect(gate.log.at(-1)).toMatchObject({ user: "u1", success: false });
  });
  it("valore mancante, zero o negativo non scrive e non cancella", async () => {
    const { call, gate } = setup();
    await call("Bearer codice-uno", { passi: `${TODAY};8000`, bici_km: `${TODAY};10` });
    const out = await call("Bearer codice-uno", { passi: `${TODAY};0`, bici_km: `${TODAY};-3` });
    expect(out.body.ok).toBe(false);
    expect(gate.activity.get(`u1|${TODAY}`)).toMatchObject({ steps: 8000, km: 10 });
  });
});

describe("scrittura", () => {
  it("un valore inserito a mano non viene sovrascritto", async () => {
    const { call, gate } = setup();
    gate.activity.set(`u1|${TODAY}`, { steps: 5000, stepsSource: "manuale", km: null, kmSource: null });
    const out = await call("Bearer codice-uno", { passi: `${TODAY};9000`, bici_km: `${TODAY};10` });
    expect(out.body.lasciate_manuali).toEqual([{ data: TODAY, campo: "passi", motivo: "Valore inserito a mano: non viene sovrascritto." }]);
    expect(out.body.salvate).toEqual([{ data: TODAY, bici_km: 10 }]);
    expect(gate.activity.get(`u1|${TODAY}`)).toMatchObject({ steps: 5000, stepsSource: "manuale", km: 10, kmSource: "salute" });
  });
  it("invio ripetuto senza doppioni; il secondo invio aggiorna il valore", async () => {
    const { call, gate } = setup();
    await call("Bearer codice-uno", { passi: `${TODAY};4000` });
    await call("Bearer codice-uno", { passi: `${TODAY};4000` });
    expect(gate.activity.size).toBe(1);
    await call("Bearer codice-uno", { passi: `${TODAY};6500` });
    expect(gate.activity.size).toBe(1);
    expect(gate.activity.get(`u1|${TODAY}`)?.steps).toBe(6500);
  });
  it("per una data ripetuta nello stesso invio vale l'ultimo valore", async () => {
    const { call, gate } = setup();
    await call("Bearer codice-uno", { passi: `${TODAY};1000\n${TODAY};2000` });
    expect(gate.activity.get(`u1|${TODAY}`)?.steps).toBe(2000);
  });
  it("due utenti non si vedono", async () => {
    const { call, gate } = setup();
    await call("Bearer codice-uno", { passi: `${TODAY};1000` });
    await call("Bearer codice-due", { passi: `${TODAY};2000`, bici_km: `${TODAY};3` });
    expect(gate.activity.get(`u1|${TODAY}`)).toMatchObject({ steps: 1000, km: null });
    expect(gate.activity.get(`u2|${TODAY}`)).toMatchObject({ steps: 2000, km: 3 });
    expect(gate.log.map((l) => l.user)).toEqual(["u1", "u2"]);
  });
});

describe("corpo non utilizzabile", () => {
  it.each([[null], ["testo"], [[1, 2]], [{}], [{ passi: null }]])("%j → 400 e chiamata registrata", async (body) => {
    const { call, gate } = setup();
    const out = await call("Bearer codice-uno", body);
    expect(out.status).toBe(400);
    expect(out.body.ok).toBe(false);
    expect(gate.log).toHaveLength(1);
    expect(gate.log[0]).toMatchObject({ user: "u1", success: false });
  });
  it("con un codice sbagliato resta 401, non 400", async () => {
    const { call } = setup();
    expect((await call("Bearer sbagliato", null)).status).toBe(401);
  });
});

describe("limite giornaliero", () => {
  it("oltre il limite: 429 con messaggio chiaro", async () => {
    const { call } = setup();
    const body = { passi: `${TODAY};1000` };
    expect((await call("Bearer codice-uno", body, { dailyLimit: 2 })).status).toBe(200);
    expect((await call("Bearer codice-uno", body, { dailyLimit: 2 })).status).toBe(200);
    const out = await call("Bearer codice-uno", body, { dailyLimit: 2 });
    expect(out.status).toBe(429);
    expect((out.body as HealthBody).messaggio).toContain("2 al giorno");
    // Un altro utente non è toccato dal limite.
    expect((await call("Bearer codice-due", body, { dailyLimit: 2 })).status).toBe(200);
  });
  it("il limite predefinito è 200 al giorno", async () => {
    const { call, gate } = setup();
    for (let i = 0; i < 200; i++) gate.log.push({ user: "u1", success: true, detail: "" });
    expect((await call("Bearer codice-uno", { passi: `${TODAY};1` })).status).toBe(429);
  });
});

describe("database non raggiungibile", () => {
  it("risponde 503", async () => {
    const gate = { ingest: async () => Promise.reject(new Error("rete")) };
    const out = await handleHealthIngest({ gate, now: NOW }, "Bearer x", { passi: `${TODAY};1` });
    expect(out.status).toBe(503);
  });
});
