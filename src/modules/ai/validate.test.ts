import { describe, expect, it } from "vitest";
import { parseProposal } from "./validate";

const dish = { name: " Riso ", quantity: " 100 g ", quantityAssumed: false, kcal: 130.4, protein: 2.66, carbs: 28, fat: 0.3, fiber: 0.4, salt: 0, note: "ok" };
const meal = (d: unknown, slot = "pranzo") => ({ meals: [{ slot, dishes: [d] }] });

describe("pasto libero (T5b.3)", () => {
  const withFlag = (freeMeal: unknown) => ({ meals: [{ slot: "pranzo", freeMeal, dishes: [dish] }] });
  it("campo vero e falso", () => {
    expect(parseProposal(withFlag(true))?.meals[0].freeMeal).toBe(true);
    expect(parseProposal(withFlag(false))?.meals[0].freeMeal).toBe(false);
  });
  it("campo assente: falso; non booleano: risposta non valida", () => {
    expect(parseProposal(meal(dish))?.meals[0].freeMeal).toBe(false);
    expect(parseProposal(withFlag("sì"))).toBeNull();
    expect(parseProposal(withFlag(1))).toBeNull();
  });
});

describe("quantità lunghe (T5b.2)", () => {
  const many = "200 g carne di maiale, 10 g pangrattato, 300 g salsa di pomodoro, 20 g parmigiano, 15 g olio, 1 uovo, sale e prezzemolo q.b., 30 g cipolla, 50 g pane";
  it("accetta una quantità di tre o più ingredienti, per intero", () => {
    expect(parseProposal({ meals: [{ slot: "pranzo", dishes: [{ ...dish, quantity: many }] }] })?.meals[0].dishes[0].quantity).toBe(many);
  });
  it("oltre 500 caratteri la quantità viene troncata, la risposta resta valida", () => {
    const q = parseProposal({ meals: [{ slot: "pranzo", dishes: [{ ...dish, quantity: "x".repeat(900) }] }] })?.meals[0].dishes[0].quantity;
    expect(q).toHaveLength(500);
  });
});

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

describe("peso del piatto (T7.0)", () => {
  const weight = (w: unknown) => parseProposal(meal({ ...dish, weightG: w }))?.meals[0].dishes[0].weightG;
  it("con il peso: intero, tenuto", () => {
    expect(weight(185)).toBe(185);
    expect(weight(185.4)).toBe(185);
    expect(weight(5000)).toBe(5000);
  });
  it("senza il peso la risposta resta valida e il peso è null", () => {
    expect(parseProposal(meal(dish))).not.toBeNull();
    expect(weight(undefined)).toBeNull();
    expect(weight(null)).toBeNull();
  });
  it.each([[0], [-20], [5001], [Number.NaN], ["185"]])("peso non valido (%s): si scarta, il piatto resta valido", (w) => {
    expect(parseProposal(meal({ ...dish, weightG: w }))).not.toBeNull();
    expect(weight(w)).toBeNull();
  });
});

describe("preferiti messi con un'etichetta (T7.2)", () => {
  const withFavs = (favorites: unknown, dishes: unknown[] = [dish]) => ({ meals: [{ slot: "pranzo", dishes, favorites }] });
  it("elenco assente: nessun preferito, la risposta resta valida", () => {
    expect(parseProposal(meal(dish))?.meals[0].favorites).toBeUndefined();
    expect(parseProposal(withFavs(null))?.meals[0].favorites).toBeUndefined();
  });
  it("preferito con grammi o con porzioni", () => {
    const p = parseProposal(withFavs([{ ref: 1, quantitySaid: true, grams: 100, servings: null }, { ref: 2, quantitySaid: true, grams: null, servings: 1.5 }]));
    expect(p?.meals[0].favorites).toEqual([
      { ref: 1, quantitySaid: true, grams: 100, servings: null },
      { ref: 2, quantitySaid: true, grams: null, servings: 1.5 },
    ]);
  });
  it("quantità non detta: grammi e porzioni si azzerano; «detta» senza numeri vale non detta", () => {
    const p = parseProposal(withFavs([{ ref: 1, quantitySaid: false, grams: 100, servings: 2 }, { ref: 2, quantitySaid: true, grams: 0, servings: -1 }]));
    expect(p?.meals[0].favorites).toEqual([
      { ref: 1, quantitySaid: false, grams: null, servings: null },
      { ref: 2, quantitySaid: false, grams: null, servings: null },
    ]);
  });
  it("un pasto con solo preferiti è valido; senza piatti né preferiti no", () => {
    expect(parseProposal(withFavs([{ ref: 1, quantitySaid: false, grams: null, servings: null }], []))).not.toBeNull();
    expect(parseProposal(withFavs([], []))).toBeNull();
    expect(parseProposal(withFavs(undefined, []))).toBeNull();
  });
  it("riferimento non valido o elenco non valido: risposta non valida", () => {
    for (const ref of [0, -1, 1.5, "1", 100, null]) expect(parseProposal(withFavs([{ ref, quantitySaid: false, grams: null, servings: null }])), String(ref)).toBeNull();
    expect(parseProposal(withFavs("sì"))).toBeNull();
    expect(parseProposal(withFavs([42]))).toBeNull();
  });
});
