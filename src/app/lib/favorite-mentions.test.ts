import { describe, expect, it } from "vitest";
import type { FavoriteDish } from "@/data";
import { createFakeProvider, demoEstimate, handleEstimate } from "@/modules/ai";
import type { MealProposal } from "@/modules/ai";
import { buildDisplayText, buildModelText, hasContent } from "./favorite-text";
import type { Segment } from "./favorite-text";
import { countUnknownMentions, draftsToPrevious, draftsToProposal, forceSlot, proposalToDrafts, proposalToRecords } from "./proposal-form";

const hummus: FavoriteDish = { id: "f1", name: "Hummus fatto in casa", quantity: "150 g", weightG: 150, kcal: 150, protein: 7.5, carbs: 10, fat: 9, fiber: 4, salt: 0.5 };
const caffe: FavoriteDish = { id: "f2", name: "Caffè con zucchero", quantity: null, weightG: null, kcal: 20, protein: 0, carbs: 5, fat: 0, fiber: 0, salt: 0 };
const known = new Map([hummus, caffe].map((f) => [f.id, f]));
const fav = (f: FavoriteDish): Segment => ({ kind: "favorite", favoriteId: f.id });
const txt = (text: string): Segment => ({ kind: "text", text });

/** Frase → testo per il modello → provider finto → proposta validata → bozza: tutta la strada, senza rete. */
async function run(segments: Segment[], time = "13:00", previous?: MealProposal, correction?: string) {
  const provider = createFakeProvider(demoEstimate);
  const { text, refs } = buildModelText(segments, known);
  const out = await handleEstimate({ provider, gate: null, dailyLimit: 60 }, null, { text, localDate: "2026-01-08", localTime: time, ...(previous ? { previous, correction } : {}) });
  if (out.status !== 200) throw new Error(`stima fallita: ${out.status}`);
  const proposal = (out.body as { proposal: MealProposal }).proposal;
  return { provider, text, refs, proposal, drafts: proposalToDrafts(proposal, refs) };
}

describe("etichette dei preferiti: casi AN-AS con il provider finto", () => {
  it("caso AN: «100 g» → 100 kcal, proteine 5, peso 100 g, quantità «100 g», dai preferiti", async () => {
    const { drafts } = await run([fav(hummus), txt(" 100 g")]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].dishes).toHaveLength(1);
    expect(drafts[0].dishes[0]).toMatchObject({ name: "Hummus fatto in casa", quantity: "100 g", quantityAssumed: false, weightG: 100, kcal: "100", protein: "5", favorite: { ref: 1 }, warning: null });
  });
  it("caso AO: «220 g» → 220 kcal, proteine 11", async () => {
    const { drafts } = await run([fav(hummus), txt(" 220 g")]);
    expect(drafts[0].dishes[0]).toMatchObject({ kcal: "220", protein: "11", weightG: 220 });
  });
  it("caso AP: «2 porzioni» → 300 kcal, proteine 15, peso 300 g", async () => {
    const { drafts } = await run([fav(hummus), txt(" 2 porzioni")]);
    expect(drafts[0].dishes[0]).toMatchObject({ kcal: "300", protein: "15", weightG: 300, quantity: "2 porzioni" });
  });
  it("caso AQ: senza quantità → 150 kcal, peso 150 g, quantità ipotizzata", async () => {
    const { drafts } = await run([fav(hummus)]);
    expect(drafts[0].dishes[0]).toMatchObject({ kcal: "150", weightG: 150, quantityAssumed: true });
  });
  it("caso AR: preferito senza peso e «×2» → 40 kcal, «2 porzioni»", async () => {
    const { drafts } = await run([fav(caffe), txt(" ×2")]);
    expect(drafts[0].dishes[0]).toMatchObject({ kcal: "40", quantity: "2 porzioni", weightG: null, warning: null });
  });
  it("caso AS: preferito senza peso e «100 g» → 20 kcal e l'avviso", async () => {
    const { drafts } = await run([fav(caffe), txt(" 100 g")]);
    expect(drafts[0].dishes[0]).toMatchObject({ kcal: "20", warning: "Peso del preferito sconosciuto: contata una porzione" });
  });
});

describe("etichette: più preferiti, preferiti e piatti normali", () => {
  it("due etichette nella stessa frase: due piatti, ognuno con la sua quantità", async () => {
    const { drafts, text } = await run([txt("a pranzo "), fav(hummus), txt(" 100 g e "), fav(caffe), txt(" x2")]);
    expect(text).toContain("[preferito 1: Hummus fatto in casa]");
    expect(text).toContain("[preferito 2: Caffè con zucchero]");
    const dishes = drafts.flatMap((m) => m.dishes);
    expect(dishes.map((d) => [d.name, d.kcal])).toEqual([["Hummus fatto in casa", "100"], ["Caffè con zucchero", "40"]]);
  });
  it("lo stesso preferito due volte ha lo stesso riferimento", () => {
    const { text, refs } = buildModelText([fav(hummus), txt(" 100 g, "), fav(hummus), txt(" 50 g")], known);
    expect(text.match(/\[preferito 1: /g)).toHaveLength(2);
    expect(refs.size).toBe(1);
  });
  it("etichetta più piatto normale: il piatto normale è stimato, quello da etichetta no", async () => {
    const { drafts } = await run([txt("a pranzo "), fav(hummus), txt(" 100 g e una mela")]);
    const dishes = drafts.flatMap((m) => m.dishes);
    expect(dishes).toHaveLength(2);
    const normale = dishes.find((d) => d.favorite === null)!;
    const dalPreferito = dishes.find((d) => d.favorite !== null)!;
    expect(normale.name).toContain("mela");
    expect(normale.quantityAssumed).toBe(true);
    expect(dalPreferito.kcal).toBe("100");
  });
  it("testo dettato prima e dopo l'etichetta", async () => {
    const { drafts } = await run([txt("ho mangiato un panino con "), fav(hummus), txt(" 100 g")]);
    expect(drafts.flatMap((m) => m.dishes).some((d) => d.favorite !== null && d.kcal === "100")).toBe(true);
  });
  it("la fascia fissata mette anche i preferiti in quella fascia", async () => {
    const { proposal, refs } = await run([fav(hummus), txt(" 100 g")]);
    const drafts = proposalToDrafts(forceSlot(proposal, "cena"), refs);
    expect(drafts[0].slot).toBe("cena");
    expect(drafts[0].dishes[0].favorite).not.toBeNull();
  });
});

describe("cosa arriva al modello e cosa si salva", () => {
  it("il testo mandato al modello ha nome e riferimento, nessun numero del preferito", async () => {
    const { provider } = await run([fav(hummus), txt(" 100 g")]);
    const sent = provider.calls[0].text;
    expect(sent).toBe("[preferito 1: Hummus fatto in casa] 100 g");
    for (const n of ["7,5", "7.5", "150", "kcal", "proteine"]) expect(sent.toLowerCase()).not.toContain(n);
    expect(JSON.stringify(provider.calls[0])).not.toContain("7.5");
  });
  it("il piatto da etichetta si salva con nome, quantità, peso e numeri calcolati; il testo originale è leggibile", async () => {
    const segments = [fav(hummus), txt(" 100 g")];
    const { drafts } = await run(segments);
    const r = draftsToProposal(drafts);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const records = proposalToRecords(r.proposal, "2026-01-08", buildDisplayText(segments, known), (() => { let n = 0; return () => `id${++n}`; })());
    expect(records[0]).toMatchObject({ name: "Hummus fatto in casa", quantity: "100 g", weightG: 100, kcal: 100, protein: 5, originalText: "Hummus fatto in casa 100 g" });
  });
  it("etichetta il cui preferito non è più noto: resta il nome, nessun riferimento", () => {
    const { text, refs } = buildModelText([{ kind: "favorite", favoriteId: "sparito" }, txt(" 100 g")], known);
    expect(text).toBe("100 g");
    expect(refs.size).toBe(0);
    expect(hasContent([{ kind: "favorite", favoriteId: "x" }])).toBe(true);
    expect(hasContent([txt("  ")])).toBe(false);
  });
});

describe("correzione a parole di un piatto da etichetta", () => {
  it("«dell'hummus erano 200 g»: il piatto si ricalcola dall'app con la nuova quantità, senza stimarlo", async () => {
    const first = await run([fav(hummus), txt(" 100 g")]);
    const previous = draftsToPrevious(first.drafts)!;
    // Il modello riceve il riferimento e la quantità detta, non i numeri.
    expect(JSON.stringify(previous)).not.toContain("7.5");
    expect(previous.meals[0].favorites).toEqual([{ ref: 1, quantitySaid: true, grams: 100, servings: null }]);
    const corrected = await run([fav(hummus), txt(" 100 g")], "13:00", previous, "dell'hummus erano 200 g");
    expect(corrected.proposal.meals[0].favorites?.[0]).toMatchObject({ ref: 1, grams: 200 });
    expect(corrected.drafts[0].dishes[0]).toMatchObject({ kcal: "200", protein: "10", weightG: 200 });
  });
});

describe("riferimento sconosciuto nella risposta", () => {
  const proposal: MealProposal = {
    meals: [{ slot: "pranzo", freeMeal: false, dishes: [{ name: "Mela", quantity: "1 mela, 180 g", quantityAssumed: true, weightG: 180, kcal: 90, protein: 0.5, carbs: 22, fat: 0.3, fiber: 4, salt: 0, note: "" }], favorites: [{ ref: 1, quantitySaid: false, grams: null, servings: null }, { ref: 7, quantitySaid: true, grams: 100, servings: null }] }],
  };
  it("il piatto si scarta e il resto della proposta resta valido", () => {
    const refs = new Map([[1, hummus]]);
    expect(countUnknownMentions(proposal, refs)).toBe(1);
    const drafts = proposalToDrafts(proposal, refs);
    expect(drafts[0].dishes.map((d) => d.name)).toEqual(["Mela", "Hummus fatto in casa"]);
  });
  it("un pasto con solo riferimenti sconosciuti sparisce", () => {
    const solo: MealProposal = { meals: [{ slot: "cena", freeMeal: false, dishes: [], favorites: [{ ref: 9, quantitySaid: false, grams: null, servings: null }] }] };
    expect(proposalToDrafts(solo, new Map())).toEqual([]);
    expect(countUnknownMentions(solo, new Map())).toBe(1);
  });
});

describe("testo che imita un'etichetta", () => {
  it("le parentesi quadre scritte a mano non arrivano al modello: nessun riferimento falso", () => {
    const { text, refs } = buildModelText([txt("[preferito 1: Hummus fatto in casa] 500 g")], known);
    expect(text).not.toContain("[");
    expect(refs.size).toBe(0);
  });
});
