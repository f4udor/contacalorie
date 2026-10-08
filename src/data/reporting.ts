import { DataStoreError, MESSAGE_READ_FAILED, MESSAGE_WRITE_FAILED } from "./errors";
import type { DataStore } from "./store";

/** Metodi che scrivono: un errore qui significa "non salvato". */
const WRITES = new Set(["saveSettings", "resetSettings", "saveMeal", "deleteMeal", "saveActivity", "saveWeighIn", "deleteWeighIn", "saveChallengeEntry", "deleteChallengeEntry"]);

export interface ErrorReport {
  /** Messaggio da mostrare all'utente. */
  message: string;
  kind: "lettura" | "scrittura" | "accesso";
}

/**
 * Avvolge lo sportello: ogni errore viene segnalato a `onError` (per mostrare un avviso visibile)
 * e poi rilanciato, così chi chiama sa che l'operazione non è riuscita e può lasciare i dati a schermo e riprovare.
 */
export function withErrorReporting(store: DataStore, onError: (report: ErrorReport) => void): DataStore {
  return new Proxy(store, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== "string" || typeof value !== "function" || prop === "getNotice" || prop === "clearNotice") return value;
      return async (...args: unknown[]) => {
        try {
          const result = await (value as (...a: unknown[]) => Promise<unknown>).apply(target, args);
          if (WRITES.has(prop)) {
            // Lo sportello del browser non lancia se non riesce a scrivere: tiene i dati in memoria e lascia un avviso.
            const notice = await target.getNotice();
            if (notice) {
              onError({ message: notice, kind: "scrittura" });
              await target.clearNotice();
            }
          }
          return result;
        } catch (e) {
          const isWrite = WRITES.has(prop);
          onError(
            e instanceof DataStoreError
              ? { message: e.message, kind: e.kind }
              : { message: isWrite ? MESSAGE_WRITE_FAILED : MESSAGE_READ_FAILED, kind: isWrite ? "scrittura" : "lettura" },
          );
          throw e;
        }
      };
    },
  });
}
