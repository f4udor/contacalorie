import { describe, expect, it } from "vitest";
import type { ActivityRecord, MealRecord } from "@/data";
import { CSV_BOM, csvNumber, csvText, dishesCsv, measurementsCsv } from "./export-csv";

const dish = (id: string, date: string, slot: MealRecord["slot"], o: Partial<MealRecord> = {}): MealRecord => ({
  id, date, slot, name: id, quantity: null, kcal: 100, protein: 1.5, carbs: 10, fat: 2, fiber: 3, salt: 0.4, isFree: false, originalText: null, ...o,
});
const lines = (csv: string) => csv.replace(CSV_BOM, "").split("\r\n").filter(Boolean);

describe("csvNumber / csvText", () => {
  it("numeri con la virgola, vuoti per i valori assenti", () => {
    expect(csvNumber(12.5)).toBe("12,5");
    expect(csvNumber(1994)).toBe("1994");
    expect(csvNumber(0)).toBe("0");
    expect(csvNumber(null)).toBe("");
    expect(csvNumber(undefined)).toBe("");
    expect(csvNumber(0.1 + 0.2)).toBe("0,3");
  });
  it("testo: virgolette dove servono, formule neutralizzate", () => {
    expect(csvText("Pasta")).toBe("Pasta");
    expect(csvText("riso; pollo")).toBe('"riso; pollo"');
    expect(csvText('il "migliore"')).toBe('"il ""migliore"""');
    expect(csvText("riga\ndue")).toBe('"riga\ndue"');
    expect(csvText("=SOMMA(A1)")).toBe("'=SOMMA(A1)");
    expect(csvText("+39 pizza")).toBe("'+39 pizza");
    expect(csvText(null)).toBe("");
  });
});

describe("dishesCsv", () => {
  it("intestazione, BOM, righe in ordine di data e fascia, sì/no per il libero", () => {
    const { content, rows } = dishesCsv({
      meals: [
        dish("cena2", "2026-01-06", "cena", { isFree: true, kcal: 900 }),
        dish("pranzo1", "2026-01-05", "pranzo", { quantity: "100 g", salt: 1.25 }),
        dish("colazione1", "2026-01-05", "colazione"),
        dish("pranzo0", "2026-01-05", "pranzo"),
      ],
    });
    expect(content.startsWith(CSV_BOM)).toBe(true);
    expect(content.endsWith("\r\n")).toBe(true);
    const l = lines(content);
    expect(rows).toBe(4);
    expect(l[0]).toBe("Data;Pasto;Piatto;Quantità;Kcal;Proteine (g);Carboidrati (g);Grassi (g);Fibre (g);Sale (g);Libero");
    expect(l.slice(1).map((x) => x.split(";")[2])).toEqual(["colazione1", "pranzo1", "pranzo0", "cena2"]); // stesso pasto: ordine di inserimento
    expect(l[2]).toBe("2026-01-05;Pranzo;pranzo1;100 g;100;1,5;10;2;3;1,25;no");
    expect(l[4]).toBe("2026-01-06;Cena;cena2;;900;1,5;10;2;3;0,4;sì");
  });

  it("senza piatti: solo l'intestazione", () => {
    const { content, rows } = dishesCsv({ meals: [] });
    expect(rows).toBe(0);
    expect(lines(content)).toHaveLength(1);
  });

  it("un nome con punto e virgola non rompe le colonne", () => {
    const l = lines(dishesCsv({ meals: [dish("x", "2026-01-05", "pranzo", { name: "pasta; pane" })] }).content);
    expect(l[1].split(";")).toHaveLength(12); // il ";" dentro il nome fa 1 colonna in più prima di togliere le virgolette
    expect(l[1]).toContain('"pasta; pane"');
  });
});

describe("measurementsCsv", () => {
  const a = (date: string, o: Partial<ActivityRecord>): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, ...o });
  it("una riga per giorno con pesata o attività, in ordine di data, con le fonti", () => {
    const { content, rows } = measurementsCsv({
      weighIns: [{ date: "2026-01-07", weightKg: 91.5 }, { date: "2026-01-05", weightKg: 92 }],
      activity: [a("2026-01-05", { steps: 9000, stepsSource: "salute", bikeKm: 20.5, bikeKcalHealth: 600, bikeSource: "manuale" }), a("2026-01-06", { steps: 100, stepsSource: "manuale" })],
    });
    const l = lines(content);
    expect(rows).toBe(3);
    expect(l[0]).toBe("Data;Peso (kg);Passi;Fonte passi;Km in bici;Kcal bici;Fonte bici");
    expect(l[1]).toBe("2026-01-05;92;9000;Salute;20,5;600;manuale");
    expect(l[2]).toBe("2026-01-06;;100;manuale;;;");
    expect(l[3]).toBe("2026-01-07;91,5;;;;;");
  });
  it("senza dati: solo l'intestazione", () => {
    expect(measurementsCsv({ weighIns: [], activity: [] }).rows).toBe(0);
  });
});
