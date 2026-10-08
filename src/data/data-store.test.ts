import { describe, expect, it } from "vitest";
import { BROWSER_STORAGE_KEY, createBrowserDataStore, NOTICE_UNKNOWN_VERSION, NOTICE_UNREADABLE, NOTICE_WRITE_FAILED } from "./index";
import type { DataStore, MealRecord, StorageLike } from "./index";
import { createMemoryDataStore } from "./memory";
import { FakeSupabaseDb } from "./fake-supabase";
import { SupabaseDataStore } from "./supabase";

class FakeStorage implements StorageLike {
  items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

function meal(id: string, date: string, kcal = 500): MealRecord {
  return { id, date, name: id, slot: "pranzo", kcal, protein: 10, carbs: 20, fat: 5, fiber: 2, salt: 1, isFree: false, originalText: null };
}

const factories: [string, () => DataStore][] = [
  ["in memoria", () => createMemoryDataStore()],
  ["nel browser", () => createBrowserDataStore(new FakeStorage())],
  ["su Supabase (finto)", () => {
    const client = new FakeSupabaseDb().client();
    return new SupabaseDataStore(async () => client);
  }],
];

describe.each(factories)("DataStore %s", (_nome, make) => {
  it("parte vuoto, senza messaggi", async () => {
    const s = make();
    expect(await s.getSettings()).toEqual({});
    expect(await s.listMeals("2026-01-05")).toEqual([]);
    expect(await s.getActivity("2026-01-05")).toBeNull();
    expect(await s.listWeighIns()).toEqual([]);
    expect(await s.getNotice()).toBeNull();
  });

  it("pasti: scrittura, lettura per giorno e per intervallo, modifica, eliminazione", async () => {
    const s = make();
    await s.saveMeal(meal("a", "2026-01-05"));
    await s.saveMeal(meal("b", "2026-01-06"));
    await s.saveMeal(meal("c", "2026-01-06", 300));
    expect((await s.listMeals("2026-01-06")).map((m) => m.id)).toEqual(["b", "c"]);
    expect((await s.listMealsBetween("2026-01-05", "2026-01-06")).map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(await s.listMealsBetween("2026-01-07", "2026-01-09")).toEqual([]);

    await s.saveMeal({ ...meal("b", "2026-01-06"), kcal: 999, name: "nuovo" });
    const b = (await s.listMeals("2026-01-06")).find((m) => m.id === "b");
    expect(b).toMatchObject({ kcal: 999, name: "nuovo" });
    expect(await s.listMeals("2026-01-06")).toHaveLength(2);

    await s.deleteMeal("b");
    expect((await s.listMeals("2026-01-06")).map((m) => m.id)).toEqual(["c"]);
    await s.deleteMeal("non-esiste");
    expect(await s.listMeals("2026-01-05")).toHaveLength(1);
  });

  it("le liste restituite sono copie", async () => {
    const s = make();
    await s.saveMeal(meal("a", "2026-01-05"));
    const lista = await s.listMeals("2026-01-05");
    lista[0].kcal = 1;
    lista.pop();
    expect((await s.listMeals("2026-01-05"))[0].kcal).toBe(500);
  });

  it("impostazioni: unione, rimozione di un campo, ripristino", async () => {
    const s = make();
    await s.saveSettings({ baseKcal: 2000, weightKg: 90 });
    await s.saveSettings({ margin: 0.2 });
    expect(await s.getSettings()).toEqual({ baseKcal: 2000, weightKg: 90, margin: 0.2 });
    await s.saveSettings({ baseKcal: undefined });
    expect(await s.getSettings()).toEqual({ weightKg: 90, margin: 0.2 });
    await s.resetSettings();
    expect(await s.getSettings()).toEqual({});
  });

  it("attività: una sola per data, sostituita alla seconda scrittura", async () => {
    const s = make();
    const base = { date: "2026-01-05", steps: 8000, stepsSource: "manuale", bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null } as const;
    await s.saveActivity(base);
    await s.saveActivity({ ...base, steps: 9000, bikeKm: 20, bikeSource: "salute", bikeKmManual: 8 });
    expect(await s.getActivity("2026-01-05")).toMatchObject({ steps: 9000, bikeKm: 20, bikeKmManual: 8 });
    expect(await s.listActivityBetween("2026-01-01", "2026-01-31")).toHaveLength(1);
    expect(await s.listActivityBetween("2026-02-01", "2026-02-28")).toEqual([]);
  });

  it("pesate: ordinate per data, una per giorno, eliminabili", async () => {
    const s = make();
    await s.saveWeighIn({ date: "2026-01-07", weightKg: 99 });
    await s.saveWeighIn({ date: "2026-01-05", weightKg: 100 });
    await s.saveWeighIn({ date: "2026-01-07", weightKg: 98.5 });
    expect(await s.listWeighIns()).toEqual([
      { date: "2026-01-05", weightKg: 100 },
      { date: "2026-01-07", weightKg: 98.5 },
    ]);
    await s.deleteWeighIn("2026-01-05");
    expect(await s.listWeighIns()).toEqual([{ date: "2026-01-07", weightKg: 98.5 }]);
  });

  it("exportAll restituisce tutti i dati (copia)", async () => {
    const s = make();
    await s.saveSettings({ weightKg: 90 });
    await s.saveMeal(meal("a", "2026-01-05"));
    await s.saveMeal(meal("b", "2026-01-06"));
    await s.saveActivity({ date: "2026-01-05", steps: 100, stepsSource: "manuale", bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null });
    await s.saveWeighIn({ date: "2026-01-05", weightKg: 90 });
    const all = await s.exportAll();
    expect(all.version).toBe(1);
    expect(all.settings).toEqual({ weightKg: 90 });
    expect(all.meals.map((m) => m.id).sort()).toEqual(["a", "b"]);
    expect(all.activity).toHaveLength(1);
    expect(all.weighIns).toEqual([{ date: "2026-01-05", weightKg: 90 }]);
    all.meals.pop();
    expect((await s.exportAll()).meals).toHaveLength(2);
  });

  it("preferiti: piatti e pasti, sostituzione per id, eliminazione, e compaiono in exportAll", async () => {
    const s = make();
    expect(await s.listFavoriteDishes()).toEqual([]);
    expect(await s.listFavoriteMeals()).toEqual([]);
    const body = { name: "Pasta al pesto", quantity: "80 g", kcal: 480, protein: 15, carbs: 70, fat: 16, fiber: 4, salt: 1.3 };
    await s.saveFavoriteDish({ id: "f1", ...body });
    await s.saveFavoriteDish({ id: "f2", ...body, name: "Mela", quantity: null, kcal: 95 });
    await s.saveFavoriteDish({ id: "f1", ...body, kcal: 500 });
    expect((await s.listFavoriteDishes()).map((f) => [f.id, f.kcal])).toEqual([["f1", 500], ["f2", 95]]);
    const pasto = { id: "p1", name: "Cena leggera", slot: "cena" as const, dishes: [body, { ...body, name: "Insalata", quantity: null, kcal: 60 }] };
    await s.saveFavoriteMeal(pasto);
    expect(await s.listFavoriteMeals()).toEqual([pasto]);
    const all = await s.exportAll();
    expect(all.favoriteDishes).toHaveLength(2);
    expect(all.favoriteMeals).toEqual([pasto]);
    await s.deleteFavoriteDish("f1");
    await s.deleteFavoriteMeal("p1");
    expect((await s.listFavoriteDishes()).map((f) => f.id)).toEqual(["f2"]);
    expect(await s.listFavoriteMeals()).toEqual([]);
  });

  it("il segno 'primo avvio fatto' si salva e si rilegge", async () => {
    const s = make();
    await s.saveSettings({ onboardingDone: true });
    expect(await s.getSettings()).toEqual({ onboardingDone: true });
    await s.saveSettings({ weightKg: 90 });
    expect(await s.getSettings()).toEqual({ onboardingDone: true, weightKg: 90 });
  });

  it("il messaggio si può cancellare", async () => {
    const s = make();
    await s.clearNotice();
    expect(await s.getNotice()).toBeNull();
  });
});

describe("sportello nel browser", () => {
  it("i dati sopravvivono a un nuovo sportello sullo stesso storage, con versione del formato", async () => {
    const storage = new FakeStorage();
    const a = createBrowserDataStore(storage);
    await a.saveMeal(meal("a", "2026-01-05"));
    await a.saveSettings({ weightKg: 90 });
    const b = createBrowserDataStore(storage);
    expect(await b.listMeals("2026-01-05")).toHaveLength(1);
    expect(await b.getSettings()).toEqual({ weightKg: 90 });
    expect(JSON.parse(storage.getItem(BROWSER_STORAGE_KEY)!).version).toBe(1);
    expect(await b.getNotice()).toBeNull();
  });

  it("dati salvati prima della rimozione della sfida: si leggono e il registro della sfida viene lasciato da parte", async () => {
    const storage = new FakeStorage();
    const vecchio = { version: 1, settings: { weightKg: 90, challengeStartDate: "2026-01-05" }, meals: [], activity: [], weighIns: [{ date: "2026-01-05", weightKg: 90 }], challengeLog: [{ date: "2026-01-05", exerciseId: "Crunch", status: "fatto", reps: null }] };
    storage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(vecchio));
    const s = createBrowserDataStore(storage);
    expect(await s.getNotice()).toBeNull();
    expect(await s.listWeighIns()).toHaveLength(1);
    expect("challengeLog" in (await s.exportAll())).toBe(false);
  });

  it("dati salvati prima dei preferiti: si leggono e i preferiti partono vuoti", async () => {
    const storage = new FakeStorage();
    storage.setItem(BROWSER_STORAGE_KEY, JSON.stringify({ version: 1, settings: { weightKg: 90 }, meals: [], activity: [], weighIns: [] }));
    const s = createBrowserDataStore(storage);
    expect(await s.getNotice()).toBeNull();
    expect(await s.listFavoriteDishes()).toEqual([]);
    expect(await s.listFavoriteMeals()).toEqual([]);
  });

  it.each([
    ["testo non JSON", "{{non json"],
    ["JSON che non è un oggetto", "[1,2,3]"],
    ["null", "null"],
    ["campi mancanti", JSON.stringify({ version: 1, meals: [] })],
    ["righe senza data", JSON.stringify({ version: 1, settings: {}, meals: [{ id: "x" }], activity: [], weighIns: [] })],
  ])("dati corrotti (%s): si riparte vuoti con messaggio", async (_nome, testo) => {
    const storage = new FakeStorage();
    storage.setItem(BROWSER_STORAGE_KEY, testo);
    const s = createBrowserDataStore(storage);
    expect(await s.getNotice()).toBe(NOTICE_UNREADABLE);
    expect(await s.listMeals("2026-01-05")).toEqual([]);
    expect(await s.getSettings()).toEqual({});
    await s.clearNotice();
    expect(await s.getNotice()).toBeNull();
  });

  it("versione sconosciuta: si riparte vuoti con messaggio; i nuovi dati sovrascrivono", async () => {
    const storage = new FakeStorage();
    storage.setItem(BROWSER_STORAGE_KEY, JSON.stringify({ version: 99, meals: [] }));
    const s = createBrowserDataStore(storage);
    expect(await s.getNotice()).toBe(NOTICE_UNKNOWN_VERSION);
    await s.saveMeal(meal("a", "2026-01-05"));
    expect(JSON.parse(storage.getItem(BROWSER_STORAGE_KEY)!).version).toBe(1);
  });

  it("storage che lancia in lettura: l'app non si blocca", async () => {
    const rotto: StorageLike = {
      getItem() {
        throw new Error("negato");
      },
      setItem() {},
    };
    const s = createBrowserDataStore(rotto);
    expect(await s.getNotice()).toBe(NOTICE_UNREADABLE);
    await s.saveMeal(meal("a", "2026-01-05"));
    expect(await s.listMeals("2026-01-05")).toHaveLength(1);
  });

  it("storage pieno in scrittura: l'app funziona e segnala il problema", async () => {
    const pieno: StorageLike = {
      getItem: () => null,
      setItem() {
        throw new Error("quota");
      },
    };
    const s = createBrowserDataStore(pieno);
    await s.saveMeal(meal("a", "2026-01-05"));
    expect(await s.getNotice()).toBe(NOTICE_WRITE_FAILED);
    expect(await s.listMeals("2026-01-05")).toHaveLength(1);
  });

  it("chiavi diverse non si mescolano", async () => {
    const storage = new FakeStorage();
    await createBrowserDataStore(storage, "k1").saveMeal(meal("a", "2026-01-05"));
    expect(await createBrowserDataStore(storage, "k2").listMeals("2026-01-05")).toEqual([]);
  });
});
