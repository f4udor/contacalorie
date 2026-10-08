import { describe, expect, it } from "vitest";
import { emptyMealForm, mealToForm, parseDecimal, validateMealForm } from "./meal-form";

describe("parseDecimal", () => {
  it("accetta virgola e punto", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("12.5")).toBe(12.5);
    expect(parseDecimal(" 300 ")).toBe(300);
    expect(parseDecimal(",5")).toBe(0.5);
    expect(parseDecimal("0")).toBe(0);
  });
  it("vuoto e non valido", () => {
    expect(parseDecimal("")).toBe("empty");
    expect(parseDecimal("   ")).toBe("empty");
    expect(parseDecimal("abc")).toBe("invalid");
    expect(parseDecimal("12a")).toBe("invalid");
    expect(parseDecimal("1,2,3")).toBe("invalid");
    expect(parseDecimal("1e3")).toBe("invalid");
    expect(parseDecimal("-")).toBe("invalid");
  });
  it("numeri negativi sono letti (e rifiutati dal modulo)", () => {
    expect(parseDecimal("-5")).toBe(-5);
  });
});

describe("validateMealForm", () => {
  const base = { ...emptyMealForm("cena"), kcal: "650" };

  it("solo le kcal sono obbligatorie: gli altri campi vuoti valgono 0, nome vuoto → 'Pasto'", () => {
    const r = validateMealForm(base, true);
    expect(r).toEqual({
      ok: true,
      meal: { name: "Pasto", slot: "cena", kcal: 650, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false },
    });
  });

  it("senza kcal: errore sul campo kcal", () => {
    const r = validateMealForm({ ...base, kcal: "" }, true);
    expect(r).toEqual({ ok: false, errors: { kcal: "Inserisci le kcal" } });
  });

  it("numeri non validi e negativi: errore per campo, nessun salvataggio", () => {
    const r = validateMealForm({ ...base, protein: "venti", fat: "-3", salt: "1,2" }, true);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.protein).toBe("Inserisci un numero valido");
      expect(r.errors.fat).toBe("Non può essere negativo");
      expect(r.errors.salt).toBeUndefined();
    }
  });

  it("kcal pari a 0 sono valide", () => {
    const r = validateMealForm({ ...base, kcal: "0" }, true);
    expect(r.ok).toBe(true);
  });

  it("decimali con la virgola", () => {
    const r = validateMealForm({ ...base, name: "  Yogurt ", salt: "0,4", protein: "7,5" }, true);
    expect(r.ok && r.meal).toMatchObject({ name: "Yogurt", salt: 0.4, protein: 7.5 });
  });

  it("pasto libero rifiutato se la settimana ne ha già uno", () => {
    const r = validateMealForm({ ...base, isFree: true }, false);
    expect(r).toEqual({ ok: false, errors: { isFree: "Il pasto libero di questa settimana è già stato usato" } });
    expect(validateMealForm({ ...base, isFree: true }, true).ok).toBe(true);
  });
});

describe("mealToForm", () => {
  it("riporta i numeri come testo italiano, con i campi a zero vuoti", () => {
    const f = mealToForm({ name: "Pizza", slot: "cena", kcal: 1100, protein: 40, carbs: 130.5, fat: 0, fiber: 0, salt: 0.4, isFree: true });
    expect(f).toEqual({ name: "Pizza", slot: "cena", kcal: "1100", protein: "40", carbs: "130,5", fat: "", fiber: "", salt: "0,4", isFree: true });
  });
  it("andata e ritorno senza perdere valori", () => {
    const meal = { name: "X", slot: "pranzo" as const, kcal: 321.5, protein: 12, carbs: 40, fat: 9.5, fiber: 3, salt: 1.1, isFree: false };
    const r = validateMealForm(mealToForm(meal), true);
    expect(r.ok && r.meal).toEqual(meal);
  });
});
