import { describe, expect, it } from "vitest";
import type { FavoriteDish, FavoriteMeal } from "@/data";
import { createFakeProvider, demoEstimate, handleEstimate } from "@/modules/ai";
import type { MealProposal } from "@/modules/ai";
import type { Segment } from "./favorite-text";
import { composeLabelOnlyProposal, labelOnlyPlan, parseSimpleQuantity, routeEstimate, slotFromTime } from "./label-only";
import { countUnknownMentions, draftsToPrevious, proposalToDrafts } from "./proposal-form";

const hummus: FavoriteDish = { id: "f1", name: "Hummus fatto in casa", quantity: "150 g", weightG: 150, kcal: 150, protein: 7.5, carbs: 10, fat: 9, fiber: 4, salt: 0.5 };
const body = (name: string, kcal: number) => ({ name, quantity: "1", weightG: null, kcal, protein: 5, carbs: 30, fat: 8, fiber: 1, salt: 0.4 });
const colazione: FavoriteMeal = { id: "p1", name: "Colazione solita", slot: "colazione", dishes: [body("Cappuccino", 90), body("Cornetto", 300)] };
const dishes = new Map([[hummus.id, hummus]]);
const meals = new Map([[colazione.id, colazione]]);

const txt = (text: string): Segment => ({ kind: "text", text });
const dishLabel: Segment = { kind: "favorite", favoriteId: hummus.id };
const mealLabel: Segment = { kind: "favorite", favoriteId: colazione.id, favoriteKind: "meal" };

describe("quantità semplici (T8.5, BRIEF §4.1)", () => {
  const ok = (t: string) => parseSimpleQuantity(t);
  it("grammi: «150 g», «150g», «150 G», con la virgola", () => {
    expect(ok(" 150 g")).toEqual({ unit: "g", amount: 150 });
    expect(ok("150g")).toEqual({ unit: "g", amount: 150 });
    expect(ok("150 G")).toEqual({ unit: "g", amount: 150 });
    expect(ok("62,5 g")).toEqual({ unit: "g", amount: 62.5 });
  });
  it("porzioni: «2 porzioni», «1 porzione», «mezza porzione», «una porzione»", () => {
    expect(ok("2 porzioni")).toEqual({ unit: "porzioni", amount: 2 });
    expect(ok("1 porzione")).toEqual({ unit: "porzioni", amount: 1 });
    expect(ok("1,5 porzioni")).toEqual({ unit: "porzioni", amount: 1.5 });
    expect(ok("mezza porzione")).toEqual({ unit: "porzioni", amount: 0.5 });
    expect(ok("Mezza  Porzione")).toEqual({ unit: "porzioni", amount: 0.5 });
    expect(ok("una porzione")).toEqual({ unit: "porzioni", amount: 1 });
  });
  it("«×2», «x2», «x 2», «X2»", () => {
    for (const t of ["×2", "x2", "x 2", "X2"]) expect(ok(t)).toEqual({ unit: "porzioni", amount: 2 });
  });
  it("vuoto = nessuna quantità; qualunque altra cosa, zero e negativi non sono quantità semplici", () => {
    expect(ok("")).toBeNull();
    expect(ok("   ")).toBeNull();
    for (const t of ["e una mela", "100 g e una mela", "0 g", "a pranzo", "150 grammi", "due porzioni", "-2 porzioni"]) expect(ok(t)).toBe("no");
  });
});

describe("solo etichette: quali frasi non vanno al modello", () => {
  it("un'etichetta sola, con o senza quantità", () => {
    expect(labelOnlyPlan([dishLabel])).toEqual([{ kind: "dish", favoriteId: "f1", said: null }]);
    expect(labelOnlyPlan([dishLabel, txt(" 100g")])).toEqual([{ kind: "dish", favoriteId: "f1", said: { unit: "g", amount: 100 } }]);
  });
  it("più etichette, ciascuna con la sua quantità", () => {
    const plan = labelOnlyPlan([mealLabel, txt(" "), dishLabel, txt(" 2 porzioni")]);
    expect(plan).toEqual([{ kind: "meal", favoriteId: "p1", said: null }, { kind: "dish", favoriteId: "f1", said: { unit: "porzioni", amount: 2 } }]);
  });
  it("una quantità dopo un pasto si ignora", () => {
    expect(labelOnlyPlan([mealLabel, txt(" 200 g")])).toEqual([{ kind: "meal", favoriteId: "p1", said: null }]);
  });
  it("basta una parola in più, o del testo prima dell'etichetta, perché vada al modello", () => {
    expect(labelOnlyPlan([dishLabel, txt(" 100 g e una mela")])).toBeNull();
    expect(labelOnlyPlan([txt("a pranzo "), dishLabel, txt(" 100 g")])).toBeNull();
    expect(labelOnlyPlan([dishLabel, txt(" con pane")])).toBeNull();
  });
  it("senza etichette non c'è niente da comporre", () => {
    expect(labelOnlyPlan([])).toBeNull();
    expect(labelOnlyPlan([txt("100 g")])).toBeNull();
  });
});

describe("fascia dall'ora (confini)", () => {
  it.each([
    ["04:59", "cena"], ["05:00", "colazione"], ["10:59", "colazione"], ["11:00", "pranzo"], ["14:59", "pranzo"],
    ["15:00", "spuntino"], ["18:29", "spuntino"], ["18:30", "cena"], ["23:59", "cena"], ["00:00", "cena"],
  ] as const)("%s → %s", (time, slot) => {
    expect(slotFromTime(time)).toBe(slot);
  });
});

describe("«Stima» senza modello: casi AW, AX, AY", () => {
  it("caso AW: «[Hummus fatto in casa] 100g» alle 13:10, nessuna fascia fissata → nessuna chiamata, pranzo, 100 kcal, proteine 5,0", () => {
    const route = routeEstimate([dishLabel, txt(" 100g")], dishes, meals, { localTime: "13:10" });
    expect(route.via).toBe("app");
    if (route.via !== "app") return;
    expect(route.proposal.meals[0].slot).toBe("pranzo");
    const drafts = proposalToDrafts(route.proposal, route.model.refs, route.model.mealRefs);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].slot).toBe("pranzo");
    expect(drafts[0].dishes).toHaveLength(1);
    expect(drafts[0].dishes[0]).toMatchObject({ name: "Hummus fatto in casa", kcal: "100", protein: "5", weightG: 100, quantity: "100 g", quantityAssumed: false });
  });
  it("caso AX: «[Colazione solita] [Hummus fatto in casa] 2 porzioni» alle 08:00 → nessuna chiamata, colazione con i piatti del pasto più l'hummus a 300 kcal", () => {
    const route = routeEstimate([mealLabel, txt(" "), dishLabel, txt(" 2 porzioni")], dishes, meals, { localTime: "08:00" });
    expect(route.via).toBe("app");
    if (route.via !== "app") return;
    const drafts = proposalToDrafts(route.proposal, route.model.refs, route.model.mealRefs);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].slot).toBe("colazione");
    expect(drafts[0].dishes.map((d) => [d.name, d.kcal])).toEqual([["Cappuccino", "90"], ["Cornetto", "300"], ["Hummus fatto in casa", "300"]]);
    expect(countUnknownMentions(route.proposal, route.model.refs, route.model.mealRefs)).toBe(0);
  });
  it("la fascia fissata prevale sull'ora", () => {
    const route = routeEstimate([dishLabel], dishes, meals, { fixedSlot: "cena", localTime: "08:00" });
    expect(route.via === "app" && route.proposal.meals[0].slot).toBe("cena");
  });
  it("la quantità dopo un pasto è ignorata: i numeri sono quelli salvati", () => {
    const route = routeEstimate([mealLabel, txt(" 200 g")], dishes, meals, { localTime: "08:00" });
    if (route.via !== "app") throw new Error("doveva comporla l'app");
    const drafts = proposalToDrafts(route.proposal, route.model.refs, route.model.mealRefs);
    expect(drafts[0].dishes.map((d) => d.kcal)).toEqual(["90", "300"]);
  });
  it("etichetta sconosciuta (preferito non più noto): va al modello, come prima", () => {
    expect(routeEstimate([{ kind: "favorite", favoriteId: "zzz" }], dishes, meals, { localTime: "13:00" }).via).toBe("model");
  });

  it("caso AY: «[Hummus fatto in casa] 100 g e una mela» va al modello, con nome e riferimento e nessun numero", async () => {
    const route = routeEstimate([dishLabel, txt(" 100 g e una mela")], dishes, meals, { localTime: "13:00" });
    expect(route.via).toBe("model");
    const provider = createFakeProvider(demoEstimate);
    const out = await handleEstimate({ provider, gate: null, dailyLimit: 60 }, null, { text: route.model.text, localDate: "2026-01-08", localTime: "13:00" });
    expect(out.status).toBe(200);
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0].text).toContain("[preferito 1: Hummus fatto in casa]");
    expect(provider.calls[0].text).not.toMatch(/150|7,5|7\.5/);
  });
});

describe("pasto preferito in una frase che va al modello", () => {
  const run = async (segments: Segment[], time = "08:00") => {
    const route = routeEstimate(segments, dishes, meals, { localTime: time });
    const provider = createFakeProvider(demoEstimate);
    const out = await handleEstimate({ provider, gate: null, dailyLimit: 60 }, null, { text: route.model.text, localDate: "2026-01-08", localTime: time });
    if (out.status !== 200) throw new Error(`stima fallita: ${out.status}`);
    const proposal = (out.body as { proposal: MealProposal }).proposal;
    return { route, provider, proposal, drafts: proposalToDrafts(proposal, route.model.refs, route.model.mealRefs) };
  };
  it("al modello va solo nome e riferimento del pasto; i piatti salvati compaiono con i numeri salvati; una quantità dopo il pasto è ignorata", async () => {
    const { provider, drafts, route } = await run([mealLabel, txt(" 200 g e una mela")]);
    expect(route.via).toBe("model");
    expect(provider.calls[0].text).toContain("[pasto preferito 1: Colazione solita]");
    expect(provider.calls[0].text).not.toMatch(/Cappuccino|Cornetto|\b90\b|\b300\b/);
    const all = drafts.flatMap((m) => m.dishes);
    expect(all.filter((d) => d.favorite?.meal).map((d) => [d.name, d.kcal])).toEqual([["Cappuccino", "90"], ["Cornetto", "300"]]);
    expect(all.some((d) => d.favorite === null && d.name.includes("mela"))).toBe(true);
  });
  it("la correzione a parole manda il pasto come semplice riferimento, una volta sola", async () => {
    const { drafts } = await run([mealLabel, txt(" e una mela")]);
    const previous = draftsToPrevious(drafts);
    const favs = previous?.meals.flatMap((m) => m.favorites ?? []) ?? [];
    expect(favs).toEqual([{ ref: 1, kind: "pasto", quantitySaid: false, grams: null, servings: null }]);
  });
  it("un riferimento a un pasto sconosciuto si scarta e si conta", () => {
    const proposal: MealProposal = { meals: [{ slot: "colazione", dishes: [], favorites: [{ ref: 5, kind: "pasto", quantitySaid: false, grams: null, servings: null }] }] };
    expect(countUnknownMentions(proposal, new Map(), new Map())).toBe(1);
    expect(proposalToDrafts(proposal, new Map(), new Map())).toEqual([]);
  });
});

describe("composeLabelOnlyProposal", () => {
  it("usa gli stessi numeri del testo per il modello e distingue pasti e piatti", () => {
    const route = routeEstimate([mealLabel, dishLabel], dishes, meals, { localTime: "08:00" });
    const proposal = composeLabelOnlyProposal(labelOnlyPlan([mealLabel, dishLabel]) ?? [], route.model, "colazione");
    expect(proposal.meals[0].favorites).toEqual([
      { ref: 1, kind: "pasto", quantitySaid: false, grams: null, servings: null },
      { ref: 2, quantitySaid: false, grams: null, servings: null },
    ]);
  });
});
