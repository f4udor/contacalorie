import { describe, expect, it } from "vitest";
import type { MealProposal } from "@/modules/ai";
import { applyCorrection, applyNumbers, canSaveDish, estimateSourceText, hasWritten, isDirty, valuesToProposal } from "./dish-sheet";
import { emptyMealForm } from "./meal-form";
import type { MealFormValues } from "./meal-form";

const pasta: MealFormValues = { ...emptyMealForm("cena"), name: "Pasta", quantity: "100 g pasta", kcal: "350", protein: "12" };

describe("stato di Salva", () => {
  it("in aggiunta è spento finché non è scritto nulla", () => {
    expect(hasWritten(emptyMealForm())).toBe(false);
    expect(canSaveDish(emptyMealForm(), null)).toBe(false);
    expect(canSaveDish({ ...emptyMealForm(), name: "  " }, null)).toBe(false);
  });
  it("in aggiunta si accende con un nome, una quantità o un numero", () => {
    expect(canSaveDish({ ...emptyMealForm(), name: "Mela" }, null)).toBe(true);
    expect(canSaveDish({ ...emptyMealForm(), quantity: "1 mela" }, null)).toBe(true);
    expect(canSaveDish({ ...emptyMealForm(), kcal: "80" }, null)).toBe(true);
  });
  it("in modifica è spento finché nulla è cambiato e si accende alla prima modifica", () => {
    expect(isDirty(pasta, pasta)).toBe(false);
    expect(canSaveDish(pasta, pasta)).toBe(false);
    expect(canSaveDish({ ...pasta, kcal: "400" }, pasta)).toBe(true);
    expect(canSaveDish({ ...pasta, slot: "pranzo" }, pasta)).toBe(true);
    expect(canSaveDish({ ...pasta, isFree: true }, pasta)).toBe(true);
  });
  it("tornando ai valori di partenza si rispegne; gli spazi non contano", () => {
    expect(canSaveDish({ ...pasta, kcal: "400" }, pasta)).toBe(true);
    expect(canSaveDish({ ...pasta, kcal: " 350 " }, pasta)).toBe(false);
  });
  it("mentre si salva o si stima è spento", () => {
    expect(canSaveDish({ ...pasta, kcal: "400" }, pasta, true)).toBe(false);
    expect(canSaveDish({ ...emptyMealForm(), name: "Mela" }, null, true)).toBe(false);
  });
});

describe("passaggio tra AI e Manuale", () => {
  it("i valori sono un solo oggetto: nulla si perde cambiando modo", () => {
    // I due modi leggono e scrivono gli stessi valori: scrivere in uno e ritrovarlo nell'altro è questo.
    const afterAi = applyNumbers(pasta, { kcal: 420, protein: 15, carbs: 70, fat: 6, fiber: 3, salt: 0.5 });
    expect(afterAi.name).toBe("Pasta");
    expect(afterAi.quantity).toBe("100 g pasta");
    expect(afterAi.slot).toBe("cena");
  });
});

const estimate = (dishes: { name: string; quantity: string | null; kcal: number; protein?: number }[]): MealProposal => ({
  meals: [{ slot: "cena", dishes: dishes.map((d) => ({ name: d.name, quantity: d.quantity, quantityAssumed: false, kcal: d.kcal, protein: d.protein ?? 0, carbs: 0, fat: 0, fiber: 0, salt: 0, note: "nota" })) }],
});

describe("stima che sostituisce i numeri", () => {
  it("sostituisce tutti i numeri già scritti, anche quelli che la stima lascia a zero", () => {
    const r = applyNumbers(pasta, { kcal: 420, protein: 0, carbs: 70, fat: 6.25, fiber: 3, salt: 0.5 });
    expect(r).toMatchObject({ kcal: "420", protein: "0", carbs: "70", fat: "6,25", fiber: "3", salt: "0,5" });
  });
});

describe("correzione a parole in modifica", () => {
  it("il piatto aperto diventa la stima precedente da correggere", () => {
    const p = valuesToProposal(pasta);
    expect(p.meals).toHaveLength(1);
    expect(p.meals[0]).toMatchObject({ slot: "cena", freeMeal: false });
    expect(p.meals[0].dishes[0]).toMatchObject({ name: "Pasta", quantity: "100 g pasta", kcal: 350, protein: 12, carbs: 0 });
  });
  it("numeri vuoti o non validi valgono 0 e il nome vuoto è «Piatto»", () => {
    const d = valuesToProposal({ ...emptyMealForm(), kcal: "abc" }).meals[0].dishes[0];
    expect(d).toMatchObject({ name: "Piatto", quantity: null, kcal: 0 });
  });
  it("con un solo piatto la stima aggiornata cambia nome, quantità e numeri", () => {
    const r = applyCorrection(pasta, estimate([{ name: "Pasta al pomodoro", quantity: "150 g pasta", kcal: 520, protein: 18 }]));
    expect(r.values).toMatchObject({ name: "Pasta al pomodoro", quantity: "150 g pasta", kcal: "520", protein: "18", slot: "cena" });
    expect(r.note).toBe("nota");
  });
  it("con più piatti somma i numeri e lascia nome e quantità", () => {
    const r = applyCorrection(pasta, estimate([{ name: "a", quantity: "x", kcal: 300 }, { name: "b", quantity: null, kcal: 220 }]));
    expect(r.values).toMatchObject({ name: "Pasta", quantity: "100 g pasta", kcal: "520" });
  });
  it("il testo di partenza è quello originale, se c'è", () => {
    expect(estimateSourceText(pasta, "pasta al pomodoro")).toBe("pasta al pomodoro");
    expect(estimateSourceText(pasta, null)).toBe("Pasta, 100 g pasta");
    expect(estimateSourceText({ ...pasta, quantity: "" }, "  ")).toBe("Pasta");
  });
});
