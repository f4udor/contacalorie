import { describe, expect, it } from "vitest";
import { draftsToProposal, forceSlot, freeSwitchBlock, hasDishes, proposalToDrafts, proposalToRecords, sumProposal, withInitialFree, withSlot } from "./proposal-form";
import type { FreeRules } from "./proposal-form";

const dish = (name: string, quantity: string | null, assumed: boolean, kcal: number) => ({ name, quantity, quantityAssumed: assumed, kcal, protein: 22.5, carbs: 18, fat: 14, fiber: 1, salt: 1.4, note: "nota" });
const proposal = { meals: [{ slot: "cena" as const, dishes: [dish("Anelli di totano", "150 g", true, 280), dish("Insalata", null, false, 60)] }] };

describe("proposalToDrafts", () => {
  it("numeri come testo italiano; 'ipotizzata' solo se c'è una quantità", () => {
    const [m] = proposalToDrafts(proposal);
    expect(m.slot).toBe("cena");
    expect(m.dishes[0]).toMatchObject({ name: "Anelli di totano", quantity: "150 g", quantityAssumed: true, kcal: "280", protein: "22,5", salt: "1,4" });
    expect(m.dishes[1]).toMatchObject({ quantity: "", quantityAssumed: false });
    expect(new Set(m.dishes.map((d) => d.key)).size).toBe(2);
  });
});

describe("draftsToProposal", () => {
  it("andata e ritorno senza perdere valori", () => {
    const r = draftsToProposal(proposalToDrafts(proposal));
    expect(r.ok && r.proposal).toEqual({ meals: [{ ...proposal.meals[0], freeMeal: false }] });
  });
  it("modifiche dell'utente: virgola, nome vuoto → 'Piatto', quantità vuota → null, numeri vuoti = 0", () => {
    const drafts = proposalToDrafts(proposal);
    drafts[0].dishes[0] = { ...drafts[0].dishes[0], name: " ", quantity: "", kcal: "300,5", fiber: "" };
    const r = draftsToProposal(drafts);
    expect(r.ok && r.proposal.meals[0].dishes[0]).toMatchObject({ name: "Piatto", quantity: null, quantityAssumed: false, kcal: 300.5, fiber: 0 });
  });
  it("kcal vuote o numeri non validi: errori accanto ai campi", () => {
    const drafts = proposalToDrafts(proposal);
    drafts[0].dishes[0] = { ...drafts[0].dishes[0], kcal: "", protein: "tanto" };
    drafts[0].dishes[1] = { ...drafts[0].dishes[1], fat: "-3" };
    const r = draftsToProposal(drafts);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const [a, b] = drafts[0].dishes;
      expect(r.errors[a.key]).toEqual({ kcal: "Inserisci le calorie", protein: "Inserisci un numero valido" });
      expect(r.errors[b.key]).toEqual({ fat: "Non può essere negativo" });
    }
  });
  it("un pasto senza piatti sparisce; hasDishes", () => {
    const drafts = proposalToDrafts(proposal);
    drafts[0].dishes = [];
    expect(hasDishes(drafts)).toBe(false);
    expect(draftsToProposal(drafts)).toEqual({ ok: true, proposal: { meals: [] } });
  });
});

describe("proposalToRecords", () => {
  it("un record per piatto, con data, fascia, testo originale, non libero e id diversi", () => {
    let n = 0;
    const records = proposalToRecords(proposal, "2026-01-08", "anelli di totano e insalata", () => `id${++n}`);
    expect(records.map((r) => r.id)).toEqual(["id1", "id2"]);
    expect(records[0]).toMatchObject({ date: "2026-01-08", slot: "cena", name: "Anelli di totano", quantity: "150 g", kcal: 280, protein: 22.5, isFree: false, originalText: "anelli di totano e insalata" });
    expect(records[1].quantity).toBeNull();
  });
});

describe("sumProposal", () => {
  it("somma tutti i piatti, kcal intere e grammi a un decimale, e raccoglie le note", () => {
    const p = { meals: [{ slot: "pranzo" as const, dishes: [{ ...dish("A", "1", false, 100.4), protein: 10.04, note: "uno" }, { ...dish("B", null, false, 50.4), protein: 5.06, note: "" }] }, { slot: "cena" as const, dishes: [{ ...dish("C", null, false, 10), note: "tre" }] }] };
    const s = sumProposal(p);
    expect(s).toMatchObject({ kcal: 161, protein: 37.6, carbs: 54, fat: 42, fiber: 3, salt: 4.2 });
    expect(s.notes).toEqual(["uno", "tre"]);
  });
});

describe("forceSlot", () => {
  const due = { meals: [{ slot: "colazione" as const, dishes: [dish("Cappuccino", "1 tazza", true, 90)] }, { slot: "pranzo" as const, dishes: [dish("Panino", "1", true, 420), dish("Mela", "1", true, 95)] }] };
  it("tutti i piatti, di qualunque fascia, finiscono in un solo pasto nella fascia fissata, nell'ordine proposto", () => {
    const r = forceSlot(due, "cena");
    expect(r.meals).toHaveLength(1);
    expect(r.meals[0].slot).toBe("cena");
    expect(r.meals[0].dishes.map((d) => d.name)).toEqual(["Cappuccino", "Panino", "Mela"]);
  });
  it("con una sola fascia diversa da quella fissata, la cambia", () => {
    expect(forceSlot({ meals: [{ slot: "cena", dishes: [dish("Totano", "150 g", true, 280)] }] }, "pranzo").meals[0].slot).toBe("pranzo");
  });
  it("e poi i record da salvare stanno tutti nella fascia fissata", () => {
    let n = 0;
    const records = proposalToRecords(forceSlot(due, "spuntino"), "2026-01-08", "testo", () => `id${++n}`);
    expect(records.map((r) => r.slot)).toEqual(["spuntino", "spuntino", "spuntino"]);
  });
  it("proposta senza piatti: non cambia", () => {
    expect(forceSlot({ meals: [] }, "cena")).toEqual({ meals: [] });
  });
});

describe("pasto libero nella proposta (T5b.3)", () => {
  const d = [dish("Pizza", "1 pizza", false, 900)];
  const two = { meals: [{ slot: "pranzo" as const, freeMeal: true, dishes: d }, { slot: "cena" as const, freeMeal: true, dishes: d }] };
  const rules = (o: Partial<{ weekBusy: boolean; free: string[] }> = {}): FreeRules => ({
    freeAllowedFor: (slot) => !o.weekBusy || (o.free ?? []).includes(slot),
    mealIsFreeFor: (slot) => (o.free ?? []).includes(slot),
  });

  it("il campo del modello arriva nelle bozze: vero, falso e assente", () => {
    expect(proposalToDrafts({ meals: [{ slot: "pranzo", freeMeal: true, dishes: d }] })[0].isFree).toBe(true);
    expect(proposalToDrafts({ meals: [{ slot: "pranzo", freeMeal: false, dishes: d }] })[0].isFree).toBe(false);
    expect(proposalToDrafts({ meals: [{ slot: "pranzo", dishes: d }] })[0].isFree).toBe(false);
  });
  it("segnalato dal modello e settimana libera: acceso in partenza", () => {
    const [m] = withInitialFree(proposalToDrafts({ meals: [two.meals[0]] }), rules(), true);
    expect(m.isFree).toBe(true);
  });
  it("settimana con un pasto libero già usato: spento e bloccato, anche se il modello lo segnala", () => {
    const drafts = withInitialFree(proposalToDrafts({ meals: [two.meals[0]] }), rules({ weekBusy: true, free: ["cena"] }), true);
    expect(drafts[0].isFree).toBe(false);
    expect(freeSwitchBlock(drafts, drafts[0].key, rules({ weekBusy: true, free: ["cena"] }))).toBe("settimana");
  });
  it("due pasti proposti segnalati: se ne accende al massimo uno, l'altro è bloccato ma modificabile dopo aver spento il primo", () => {
    const r = rules();
    let drafts = withInitialFree(proposalToDrafts(two), r, true);
    expect(drafts.map((m) => m.isFree)).toEqual([true, false]);
    expect(freeSwitchBlock(drafts, drafts[1].key, r)).toBe("proposta");
    expect(freeSwitchBlock(drafts, drafts[0].key, r)).toBeNull();
    drafts = drafts.map((m, i) => (i === 0 ? { ...m, isFree: false } : m));
    expect(freeSwitchBlock(drafts, drafts[1].key, r)).toBeNull();
  });
  it("sempre modificabile prima di confermare: la scelta dell'utente arriva alla proposta", () => {
    const drafts = withInitialFree(proposalToDrafts({ meals: [{ ...two.meals[0], freeMeal: false }] }), rules(), true).map((m) => ({ ...m, isFree: true }));
    const r = draftsToProposal(drafts);
    expect(r.ok && r.proposal.meals[0].freeMeal).toBe(true);
  });
  it("fascia fissata: il segnale del modello non conta, l'interruttore segue il pasto esistente", () => {
    const fixed = forceSlot(two, "pranzo");
    expect(withInitialFree(proposalToDrafts(fixed), rules(), false)[0].isFree).toBe(false);
    expect(withInitialFree(proposalToDrafts(fixed), rules({ free: ["pranzo"] }), false)[0].isFree).toBe(true);
  });
  it("cambiando la fascia l'interruttore ne segue lo stato", () => {
    const r = rules({ weekBusy: true, free: ["cena"] });
    const drafts = withInitialFree(proposalToDrafts({ meals: [{ ...two.meals[0], freeMeal: false }] }), r, true);
    expect(withSlot(drafts, drafts[0].key, "cena", r)[0]).toMatchObject({ slot: "cena", isFree: true });
    expect(withSlot(drafts, drafts[0].key, "colazione", r)[0]).toMatchObject({ slot: "colazione", isFree: false });
  });
  it("i piatti salvati portano il segno libero del loro pasto", () => {
    const records = proposalToRecords({ meals: [{ ...two.meals[0], freeMeal: true }, { ...two.meals[1], freeMeal: false }] }, "2026-01-08", "testo", (() => { let n = 0; return () => `id${++n}`; })());
    expect(records.map((r) => [r.slot, r.isFree])).toEqual([["pranzo", true], ["cena", false]]);
  });
});
