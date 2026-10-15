import { describe, expect, it } from "vitest";
import { emptyMealForm } from "./meal-form";
import type { MealFormValues } from "./meal-form";
import { NO_SCALE, markManual, parseWeightG, rescaleByServings, rescaleByWeight, servingsRatio, snapshotBase } from "./portion-scale";

const pesato: MealFormValues = { ...emptyMealForm("pranzo"), name: "Pasta", weightG: "200", kcal: "300", protein: "12", carbs: "40", fat: "8", fiber: "4", salt: "1" };
const senzaPeso: MealFormValues = { ...emptyMealForm("pranzo"), name: "Dolce", kcal: "420", protein: "10", carbs: "30", fat: "13,3", fiber: "2", salt: "1" };

describe("peso: kcal e nutrienti si ricalcolano senza AI (caso AT)", () => {
  it("200 g → 250 g: 375 kcal, carboidrati 50", () => {
    const r = rescaleByWeight(pesato, NO_SCALE, "250");
    expect(r.values).toMatchObject({ weightG: "250", kcal: "375", carbs: "50", protein: "15", fat: "10", fiber: "5", salt: "1,3" });
  });
  it("200 → 250 → 200 riporta i numeri di partenza (si parte sempre dai valori di quando la scheda è stata aperta)", () => {
    const a = rescaleByWeight(pesato, NO_SCALE, "250");
    const b = rescaleByWeight(a.values, a.state, "200");
    expect(b.values).toEqual(pesato);
    const c = rescaleByWeight(b.values, b.state, "100");
    expect(c.values).toMatchObject({ kcal: "150", carbs: "20", weightG: "100" });
  });
  it("un peso vuoto o a metà scrittura non cambia i numeri", () => {
    const a = rescaleByWeight(pesato, NO_SCALE, "250");
    for (const w of ["", "abc", "0", "12,5"]) {
      const r = rescaleByWeight(a.values, a.state, w);
      expect(r.values.kcal, w).toBe("375");
      expect(r.values.weightG, w).toBe(w);
    }
  });
  it("scrivere a mano un numero dopo il ricalcolo lo tiene così com'è; gli altri continuano a seguire il peso", () => {
    const a = rescaleByWeight(pesato, NO_SCALE, "250");
    const typed = markManual(a.state, ["protein"]);
    const edited = { ...a.values, protein: "20" };
    const b = rescaleByWeight(edited, typed, "300");
    expect(b.values.protein).toBe("20");
    expect(b.values.kcal).toBe("450");
    const back = rescaleByWeight(b.values, b.state, "200");
    expect(back.values.protein).toBe("20");
    expect(back.values.kcal).toBe("300");
  });
  it("prima del primo ricalcolo scrivere un numero non lo esclude: entra nei valori di partenza", () => {
    expect(markManual(NO_SCALE, ["protein"])).toBe(NO_SCALE);
    const r = rescaleByWeight({ ...pesato, protein: "20" }, NO_SCALE, "400");
    expect(r.values.protein).toBe("40");
  });
  it("i campi vuoti restano vuoti; senza kcal non c'è nulla da ricalcolare", () => {
    const poveri = { ...pesato, fiber: "", salt: "" };
    const r = rescaleByWeight(poveri, NO_SCALE, "250");
    expect(r.values).toMatchObject({ fiber: "", salt: "", kcal: "375" });
    const senzaKcal = rescaleByWeight({ ...pesato, kcal: "" }, NO_SCALE, "250");
    expect(senzaKcal.values).toMatchObject({ kcal: "", carbs: "40", weightG: "250" });
  });
  it("un piatto senza peso di partenza prende solo il nuovo peso: i numeri non si toccano", () => {
    const r = rescaleByWeight(senzaPeso, NO_SCALE, "150");
    expect(r.values).toEqual({ ...senzaPeso, weightG: "150" });
  });
});

describe("porzioni: piatto senza peso (caso AU)", () => {
  it("×1,5: 630 kcal, grassi 20 (19,95 arrotondato)", () => {
    const r = rescaleByServings(senzaPeso, NO_SCALE, "1,5");
    expect(r.values).toMatchObject({ kcal: "630", fat: "20", protein: "15", carbs: "45" });
  });
  it("×2 e poi ×1 riporta i numeri di partenza; ×0,5 dimezza", () => {
    const a = rescaleByServings(senzaPeso, NO_SCALE, "2");
    expect(a.values.kcal).toBe("840");
    expect(rescaleByServings(a.values, a.state, "1").values).toEqual(senzaPeso);
    expect(rescaleByServings(a.values, a.state, "0,5").values.kcal).toBe("210");
  });
  it("un numero a mano (3, 2,5); vuoto, zero o non valido lasciano i numeri come sono", () => {
    const a = rescaleByServings(senzaPeso, NO_SCALE, "3");
    expect(a.values.kcal).toBe("1260");
    expect(rescaleByServings(senzaPeso, NO_SCALE, "2,5").values.kcal).toBe("1050");
    for (const t of ["", "0", "-1", "abc"]) expect(rescaleByServings(a.values, a.state, t).values.kcal, t).toBe("1260");
  });
  it("se il piatto ha anche un peso scritto, il peso segue le porzioni", () => {
    const r = rescaleByServings({ ...senzaPeso, weightG: "150" }, NO_SCALE, "2");
    expect(r.values.weightG).toBe("300");
  });
  it("un numero scritto a mano dopo il ricalcolo resta, anche cambiando ancora le porzioni", () => {
    const a = rescaleByServings(senzaPeso, NO_SCALE, "2");
    const typed = markManual(a.state, ["kcal"]);
    const b = rescaleByServings({ ...a.values, kcal: "700" }, typed, "3");
    expect(b.values.kcal).toBe("700");
    expect(b.values.protein).toBe("30");
  });
});

describe("snapshot e peso", () => {
  it("senza kcal valide non c'è base", () => {
    expect(snapshotBase({ ...pesato, kcal: "" })).toBeNull();
    expect(snapshotBase({ ...pesato, kcal: "abc" })).toBeNull();
    expect(snapshotBase(pesato)?.weightG).toBe(200);
  });
  it("il peso valido è un intero positivo", () => {
    expect(parseWeightG("185")).toBe(185);
    for (const t of ["", "0", "-2", "1,5", "x"]) expect(parseWeightG(t), t).toBeNull();
    expect(servingsRatio("1,5")).toBe(1.5);
    expect(servingsRatio("0")).toBeNull();
  });
});
