import { describe, expect, it } from "vitest";
import { emptyMealForm, mealToForm, parseDecimal, textNeedsKcalCheck, validateMealForm } from "./meal-form";

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

describe("validateMealForm: kcal vuote", () => {
  it("senza AI: 'Inserisci le calorie'; con l'AI attiva il messaggio indica anche la stima", () => {
    const v = { ...emptyMealForm("cena"), name: "Pasta" };
    expect(validateMealForm(v, true)).toEqual({ ok: false, errors: { kcal: "Inserisci le calorie" } });
    expect(validateMealForm(v, true, true)).toEqual({ ok: false, errors: { kcal: "Inserisci le calorie o tocca «Stima con l'AI»" } });
  });
});

describe("validateMealForm", () => {
  const base = { ...emptyMealForm("cena"), kcal: "650" };

  it("solo le kcal sono obbligatorie: gli altri campi vuoti valgono 0, nome vuoto → 'Piatto'", () => {
    const r = validateMealForm(base, true);
    expect(r).toEqual({
      ok: true,
      meal: { name: "Piatto", quantity: null, slot: "cena", kcal: 650, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree: false },
    });
  });

  it("senza kcal: errore sul campo kcal", () => {
    const r = validateMealForm({ ...base, kcal: "" }, true);
    expect(r).toEqual({ ok: false, errors: { kcal: "Inserisci le calorie" } });
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

  it("la quantità è facoltativa e libera: spazi tolti, vuota = null", () => {
    const con = validateMealForm({ ...base, quantity: "  100 g  " }, true);
    expect(con.ok && con.meal.quantity).toBe("100 g");
    const senza = validateMealForm({ ...base, quantity: "   " }, true);
    expect(senza.ok && senza.meal.quantity).toBeNull();
  });

  it("decimali con la virgola", () => {
    const r = validateMealForm({ ...base, name: "  Yogurt ", salt: "0,4", protein: "7,5" }, true);
    expect(r.ok && r.meal).toMatchObject({ name: "Yogurt", salt: 0.4, protein: 7.5 });
  });

  it("pasto libero rifiutato se la settimana ne ha già uno", () => {
    const r = validateMealForm({ ...base, isFree: true }, false);
    expect(r).toEqual({ ok: false, errors: { isFree: "Già usato questa settimana." } });
    expect(validateMealForm({ ...base, isFree: true }, true).ok).toBe(true);
  });
});

describe("mealToForm", () => {
  it("riporta i numeri come testo italiano, con i campi a zero vuoti", () => {
    const f = mealToForm({ name: "Pizza", quantity: "2 fette", slot: "cena", kcal: 1100, protein: 40, carbs: 130.5, fat: 0, fiber: 0, salt: 0.4, isFree: true });
    expect(f).toEqual({ name: "Pizza", quantity: "2 fette", slot: "cena", kcal: "1100", protein: "40", carbs: "130,5", fat: "", fiber: "", salt: "0,4", isFree: true });
  });
  it("andata e ritorno senza perdere valori", () => {
    const meal = { name: "X", quantity: "100 g", slot: "pranzo" as const, kcal: 321.5, protein: 12, carbs: 40, fat: 9.5, fiber: 3, salt: 1.1, isFree: false };
    const r = validateMealForm(mealToForm(meal), true);
    expect(r.ok && r.meal).toEqual(meal);
  });
});

describe("textNeedsKcalCheck (T5b.4)", () => {
  const t = (kcal: string, protein = "", carbs = "", fat = "") => textNeedsKcalCheck({ kcal, protein, carbs, fat });
  it("caso T: 110 kcal con proteine 13, carboidrati 72, grassi 6 → da controllare (numeri con la virgola)", () => {
    expect(t("110", "13", "72", "6")).toBe(true);
    expect(t("110", "13,0", "72,0", "6,0")).toBe(true);
  });
  it("caso U (birra) e V: non segnalati", () => {
    expect(t("215", "2", "18", "0")).toBe(false);
    expect(t("380", "13", "72", "6")).toBe(false);
  });
  it("kcal vuote o non valide, o macro non validi: nessun controllo", () => {
    expect(t("", "13", "72", "6")).toBe(false);
    expect(t("abc", "13", "72", "6")).toBe(false);
    expect(t("110", "x", "72", "6")).toBe(false);
  });
  it("macro vuoti valgono 0; tutto a zero non è segnalato", () => {
    expect(t("0", "", "", "")).toBe(false);
    expect(t("10", "50", "", "")).toBe(true);
  });
  it("si ricalcola ritoccando i numeri", () => {
    expect(t("110", "13", "72", "6")).toBe(true);
    expect(t("380", "13", "72", "6")).toBe(false);
  });
});
