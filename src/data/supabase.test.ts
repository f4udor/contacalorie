import { describe, expect, it } from "vitest";
import { createDataStore, isSupabaseConfigured } from "./factory";
import { createBrowserDataStore } from "./browser";
import { DataStoreError, MESSAGE_NOT_SIGNED_IN, MESSAGE_READ_FAILED, MESSAGE_WRITE_FAILED } from "./errors";
import { FakeSupabaseDb } from "./fake-supabase";
import { withErrorReporting } from "./reporting";
import type { ErrorReport } from "./reporting";
import { SupabaseDataStore } from "./supabase";
import type { MealRecord } from "./types";

function setup() {
  const db = new FakeSupabaseDb();
  const store = new SupabaseDataStore(async () => db.client());
  return { db, store };
}
const meal = (id: string, date = "2026-01-08"): MealRecord => ({
  id, date, name: id, quantity: "100 g", slot: "pranzo", kcal: 500, protein: 10, carbs: 20, fat: 5, fiber: 2, salt: 1, isFree: true, originalText: "ho mangiato",
});

describe("SupabaseDataStore: dati", () => {
  it("scrive le righe con le colonne dello schema (snake_case) e l'utente collegato", async () => {
    const { db, store } = setup();
    await store.saveMeal(meal("a"));
    expect(db.rows("meals")[0]).toMatchObject({ id: "a", user_id: "utente-1", date: "2026-01-08", slot: "pranzo", quantity: "100 g", is_free: true, original_text: "ho mangiato", kcal: 500 });
  });

  it("rilegge i piatti con quantità, segno libero e testo originale", async () => {
    const { store } = setup();
    await store.saveMeal(meal("a"));
    expect((await store.listMeals("2026-01-08"))[0]).toEqual(meal("a"));
  });

  it("quantità assente → null", async () => {
    const { store } = setup();
    await store.saveMeal({ ...meal("a"), quantity: undefined });
    expect((await store.listMeals("2026-01-08"))[0].quantity).toBeNull();
  });

  it("i numeri che arrivano come testo (numeric) diventano numeri", async () => {
    const { db, store } = setup();
    db.rows("meals").push({ id: "x", date: "2026-01-08", slot: "cena", name: "x", kcal: "432.5", protein: "1.5", carbs: "0", fat: "0", fiber: "0", salt: "0.4", is_free: false, created_at: 1 });
    const [m] = await store.listMeals("2026-01-08");
    expect(m).toMatchObject({ kcal: 432.5, protein: 1.5, salt: 0.4 });
  });

  it("impostazioni: scrive tutte le colonne note, toglie i campi rimossi e include la nuova proteinPerKgTarget", async () => {
    const { db, store } = setup();
    await store.saveSettings({ weightKg: 92.5, baseKcal: 2000, proteinPerKgTarget: 2, challengeStartDate: "2026-01-05" });
    expect(db.rows("settings")).toHaveLength(1);
    expect(db.rows("settings")[0]).toMatchObject({ user_id: "utente-1", weight_kg: 92.5, base_kcal: 2000, protein_per_kg_target: 2, challenge_start_date: "2026-01-05", margin: null });
    await store.saveSettings({ baseKcal: undefined, margin: 0.12 });
    expect(await store.getSettings()).toEqual({ weightKg: 92.5, proteinPerKgTarget: 2, challengeStartDate: "2026-01-05", margin: 0.12 });
    expect(db.rows("settings")).toHaveLength(1);
  });

  it("registro sfida: l'esercizio si salva con il suo id nel database e si rilegge per nome", async () => {
    const { db, store } = setup();
    await store.saveChallengeEntry({ date: "2026-01-08", exerciseId: "Crunch", status: "fatto", reps: 25 });
    expect(db.rows("challenge_log")[0]).toMatchObject({ exercise_id: "ex-2", status: "fatto", reps: 25, user_id: "utente-1" });
    expect(await store.listChallengeLog("2026-01-08")).toEqual([{ date: "2026-01-08", exerciseId: "Crunch", status: "fatto", reps: 25 }]);
  });

  it("registro sfida: un esercizio sconosciuto non si salva e dà un errore chiaro", async () => {
    const { store } = setup();
    await expect(store.saveChallengeEntry({ date: "2026-01-08", exerciseId: "Sconosciuto", status: "fatto", reps: null })).rejects.toBeInstanceOf(DataStoreError);
  });
});

describe("SupabaseDataStore: tante righe", () => {
  it("exportAll e le pesate leggono a pagine: oltre le 1000 righe non se ne perde nessuna", async () => {
    const { db, store } = setup();
    for (let i = 0; i < 2500; i++) {
      db.rows("meals").push({ id: `m${i}`, user_id: "utente-1", date: "2026-01-05", slot: "pranzo", name: `p${i}`, kcal: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, is_free: false, created_at: i });
    }
    for (let i = 0; i < 1200; i++) db.rows("weigh_ins").push({ id: `w${i}`, user_id: "utente-1", date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}#${i}`, weight_kg: 90 });
    expect((await store.exportAll()).meals).toHaveLength(2500);
    expect(await store.listWeighIns()).toHaveLength(1200);
  });
});

describe("SupabaseDataStore: errori", () => {
  it("rete assente in scrittura: errore chiaro, nulla salvato", async () => {
    const { db, store } = setup();
    db.offline = true;
    const err = await store.saveMeal(meal("a")).catch((e) => e);
    expect(err).toBeInstanceOf(DataStoreError);
    expect(err.message).toBe(MESSAGE_WRITE_FAILED);
    expect(err.kind).toBe("scrittura");
    db.offline = false;
    expect(await store.listMeals("2026-01-08")).toEqual([]);
  });

  it("rete assente in lettura: errore di lettura", async () => {
    const { db, store } = setup();
    db.offline = true;
    const err = await store.listMeals("2026-01-08").catch((e) => e);
    expect(err).toMatchObject({ message: MESSAGE_READ_FAILED, kind: "lettura" });
  });

  it("errore del server: stesso trattamento", async () => {
    const { db, store } = setup();
    db.serverError = "permission denied";
    await expect(store.saveWeighIn({ date: "2026-01-08", weightKg: 90 })).rejects.toMatchObject({ kind: "scrittura" });
    await expect(store.listWeighIns()).rejects.toMatchObject({ kind: "lettura" });
  });

  it("un salvataggio fallito si può ripetere e poi riesce, senza doppioni", async () => {
    const { db, store } = setup();
    db.offline = true;
    await expect(store.saveMeal(meal("a"))).rejects.toBeInstanceOf(DataStoreError);
    db.offline = false;
    await store.saveMeal(meal("a"));
    await store.saveMeal(meal("a"));
    expect(await store.listMeals("2026-01-08")).toHaveLength(1);
  });

  it("senza accesso: errore dedicato", async () => {
    const { db, store } = setup();
    db.userId = null;
    await expect(store.saveMeal(meal("a"))).rejects.toMatchObject({ message: MESSAGE_NOT_SIGNED_IN, kind: "accesso" });
    await expect(store.getSettings()).rejects.toMatchObject({ kind: "accesso" });
  });

  it("l'elenco degli esercizi non resta in cache dopo un errore", async () => {
    const { db, store } = setup();
    db.offline = true;
    await expect(store.listChallengeLog("2026-01-08")).rejects.toBeInstanceOf(DataStoreError);
    db.offline = false;
    await expect(store.listChallengeLog("2026-01-08")).resolves.toEqual([]);
  });
});

describe("withErrorReporting", () => {
  it("segnala l'errore e lo rilancia, così chi chiama sa che non è salvato", async () => {
    const { db, store } = setup();
    const reports: ErrorReport[] = [];
    const wrapped = withErrorReporting(store, (r) => reports.push(r));
    db.offline = true;
    await expect(wrapped.saveMeal(meal("a"))).rejects.toBeInstanceOf(DataStoreError);
    await expect(wrapped.listMeals("2026-01-08")).rejects.toBeInstanceOf(DataStoreError);
    expect(reports.map((r) => r.kind)).toEqual(["scrittura", "lettura"]);
    expect(reports[0].message).toBe(MESSAGE_WRITE_FAILED);
  });

  it("non segnala nulla se va tutto bene e restituisce i dati", async () => {
    const { store } = setup();
    const reports: ErrorReport[] = [];
    const wrapped = withErrorReporting(store, (r) => reports.push(r));
    await wrapped.saveMeal(meal("a"));
    expect(await wrapped.listMeals("2026-01-08")).toHaveLength(1);
    expect(reports).toEqual([]);
  });

  it("anche un errore qualsiasi (non dello sportello) diventa un avviso con il messaggio giusto", async () => {
    const reports: ErrorReport[] = [];
    const broken = withErrorReporting(
      { ...createBrowserDataStore({ getItem: () => null, setItem() {} }), saveMeal: async () => { throw new Error("boom"); } },
      (r) => reports.push(r),
    );
    await expect(broken.saveMeal(meal("a"))).rejects.toThrow("boom");
    expect(reports[0]).toEqual({ message: MESSAGE_WRITE_FAILED, kind: "scrittura" });
  });
});

describe("withErrorReporting con lo sportello del browser", () => {
  it("se il browser non riesce a scrivere, l'avviso arriva subito (non al prossimo caricamento) e una sola volta", async () => {
    const reports: ErrorReport[] = [];
    const full = { getItem: () => null, setItem() { throw new Error("quota"); } };
    const store = withErrorReporting(createBrowserDataStore(full), (r) => reports.push(r));
    await store.saveMeal(meal("a"));
    await store.saveMeal(meal("b"));
    expect(reports).toHaveLength(2); // una per ogni scrittura fallita, mai ripetuta per la stessa
    expect(reports[0]).toMatchObject({ kind: "scrittura", message: "Non è stato possibile salvare i dati su questo dispositivo." });
    expect(await store.listMeals("2026-01-08")).toHaveLength(2); // i dati restano in memoria
  });
});

describe("scelta dello sportello", () => {
  it("Supabase solo con entrambe le variabili", () => {
    expect(isSupabaseConfigured({ url: "https://x.supabase.co", anonKey: "chiave" })).toBe(true);
    expect(isSupabaseConfigured({ url: "https://x.supabase.co", anonKey: undefined })).toBe(false);
    expect(isSupabaseConfigured({ url: undefined, anonKey: "chiave" })).toBe(false);
    expect(isSupabaseConfigured({ url: "", anonKey: "chiave" })).toBe(false);
    expect(isSupabaseConfigured({ url: "  ", anonKey: "  " })).toBe(false);
    expect(isSupabaseConfigured({ url: undefined, anonKey: undefined })).toBe(false);
  });

  it("senza variabili: sportello del browser (come prima), con Supabase: sportello Supabase", () => {
    const storage = { getItem: () => null, setItem() {} };
    expect(createDataStore({ url: undefined, anonKey: undefined })).not.toBeInstanceOf(SupabaseDataStore);
    expect(createDataStore({ url: "https://x.supabase.co", anonKey: "chiave" })).toBeInstanceOf(SupabaseDataStore);
    void storage;
  });
});
