import { describe, expect, it } from "vitest";
import { parseProposal } from "./validate";

const dish = { name: " Riso ", quantity: " 100 g ", quantityAssumed: false, kcal: 130.4, protein: 2.66, carbs: 28, fat: 0.3, fiber: 0.4, salt: 0, note: "ok" };
const meal = (d: unknown, slot = "pranzo") => ({ meals: [{ slot, dishes: [d] }] });

describe("parseProposal", () => {
  it("accetta e pulisce: spazi tolti, kcal intere, grammi a un decimale", () => {
    const p = parseProposal(meal(dish));
    expect(p?.meals[0].dishes[0]).toMatchObject({ name: "Riso", quantity: "100 g", kcal: 130, protein: 2.7 });
  });
  it("quantità vuota o assente → null", () => {
    expect(parseProposal(meal({ ...dish, quantity: "  " }))?.meals[0].dishes[0].quantity).toBeNull();
    expect(parseProposal(meal({ ...dish, quantity: null }))?.meals[0].dishes[0].quantity).toBeNull();
  });
  it.each([
    ["kcal negative", { ...dish, kcal: -1 }],
    ["kcal come testo", { ...dish, kcal: "130" }],
    ["kcal infinite", { ...dish, kcal: Infinity }],
    ["kcal assurde", { ...dish, kcal: 90000 }],
    ["nome vuoto", { ...dish, name: " " }],
    ["flag mancante", { ...dish, quantityAssumed: undefined }],
    ["sale mancante", { ...dish, salt: undefined }],
    ["piatto non oggetto", "riso"],
  ])("scarta: %s", (_n, d) => {
    expect(parseProposal(meal(d))).toBeNull();
  });
  it("scarta fascia sconosciuta, pasto senza piatti, nessun pasto, forma sbagliata", () => {
    expect(parseProposal(meal(dish, "brunch"))).toBeNull();
    expect(parseProposal({ meals: [{ slot: "pranzo", dishes: [] }] })).toBeNull();
    expect(parseProposal({ meals: [] })).toBeNull();
    expect(parseProposal(null)).toBeNull();
    expect(parseProposal([])).toBeNull();
  });
});
