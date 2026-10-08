import { SnapshotDataStore } from "./snapshot-store";
import type { HealthLinkStatus } from "./types";
import type { Persistence } from "./snapshot-store";
import type { DataStore } from "./store";

/** Parte di `Storage` che serve allo sportello (permette un finto nei test). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export const BROWSER_STORAGE_KEY = "personal-health:v1";

/**
 * Solo per gli screenshot: con questa chiave nel browser (e senza Supabase) il collegamento con Salute è simulato
 * a partire dallo stato scritto nella chiave. Senza la chiave il collegamento richiede l'accesso, come sempre.
 */
export const DEMO_HEALTH_KEY = "personal-health:demo-health";
const DEMO_CODE = "ph3f9a1c0d8b7e4a2c9d5e6f1a0b3c7d2e8f4a6b1c0d9e5f3a7b2c4d6e8f0a1b3c5";

class BrowserDataStore extends SnapshotDataStore {
  constructor(
    persistence: Persistence,
    private readonly storage: () => StorageLike,
  ) {
    super(persistence);
  }

  private demo(): HealthLinkStatus | null {
    try {
      const text = this.storage().getItem(DEMO_HEALTH_KEY);
      return text ? ({ ...(JSON.parse(text) as HealthLinkStatus), supported: true }) : null;
    } catch {
      return null;
    }
  }

  private saveDemo(status: HealthLinkStatus): void {
    this.storage().setItem(DEMO_HEALTH_KEY, JSON.stringify(status));
  }

  override async getHealthLink(): Promise<HealthLinkStatus> {
    return this.demo() ?? super.getHealthLink();
  }

  override async createHealthCode(): Promise<string> {
    const current = this.demo();
    if (!current) return super.createHealthCode();
    this.saveDemo({ ...current, active: true, codeCreatedAt: new Date().toISOString(), lastSuccessAt: null, lastAttempt: null });
    return DEMO_CODE;
  }

  override async revokeHealthCode(): Promise<void> {
    const current = this.demo();
    if (!current) return super.revokeHealthCode();
    this.saveDemo({ ...current, active: false, codeCreatedAt: null });
  }
}

/** Sportello che salva nel browser. Senza argomenti usa `window.localStorage`. */
export function createBrowserDataStore(storage?: StorageLike, key: string = BROWSER_STORAGE_KEY): DataStore {
  const get = () => storage ?? window.localStorage;
  const persistence: Persistence = {
    read: () => get().getItem(key),
    write: (text) => get().setItem(key, text),
  };
  return new BrowserDataStore(persistence, get);
}

/** Toglie dal browser tutti i dati salvati dall'app (dopo un'importazione confermata). */
export function clearBrowserData(storage?: StorageLike, key: string = BROWSER_STORAGE_KEY): void {
  (storage ?? window.localStorage).removeItem?.(key);
}
