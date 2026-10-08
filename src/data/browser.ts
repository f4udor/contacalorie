import { SnapshotDataStore } from "./snapshot-store";
import type { Persistence } from "./snapshot-store";
import type { DataStore } from "./store";

/** Parte di `Storage` che serve allo sportello (permette un finto nei test). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const BROWSER_STORAGE_KEY = "personal-health:v1";

/** Sportello che salva nel browser. Senza argomenti usa `window.localStorage`. */
export function createBrowserDataStore(storage?: StorageLike, key: string = BROWSER_STORAGE_KEY): DataStore {
  const persistence: Persistence = {
    read: () => (storage ?? window.localStorage).getItem(key),
    write: (text) => (storage ?? window.localStorage).setItem(key, text),
  };
  return new SnapshotDataStore(persistence);
}
