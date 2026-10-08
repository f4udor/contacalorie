import { describe, expect, it } from "vitest";
import { draftsToProposal, hasDishes, proposalToDrafts, proposalToRecords, sumProposal } from "./proposal-form";

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
    expect(r.ok && r.proposal).toEqual(proposal);
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
      expect(r.errors[a.key]).toEqual({ kcal: "Inserisci le kcal", protein: "Inserisci un numero valido" });
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
