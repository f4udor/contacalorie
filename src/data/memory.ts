import { SnapshotDataStore } from "./snapshot-store";
import type { DataStore } from "./store";

/** Sportello in memoria, per i test: i dati spariscono con l'oggetto. */
export function createMemoryDataStore(): DataStore {
  return new SnapshotDataStore(null);
}
