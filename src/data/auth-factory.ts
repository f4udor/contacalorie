import { DEMO_AUTH_KEY, DemoAuthService } from "./auth";
import type { AuthService } from "./auth";
import { isSupabaseConfigured, readSupabaseEnv } from "./factory";
import type { SupabaseEnv } from "./factory";
import { createSupabaseAuthService } from "./supabase-client";

/**
 * Il servizio di accesso, solo se serve:
 * - Supabase configurato → accesso vero con email e codice;
 * - altrimenti nessun accesso (l'app usa i dati del browser), tranne la modalità dimostrativa, attiva solo se nel browser
 *   esiste la chiave dimostrativa: serve a vedere le schermate di accesso senza Supabase e non dà accesso a nessun dato.
 */
export function createAuthService(env: SupabaseEnv = readSupabaseEnv(), demoStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void }): AuthService | null {
  if (isSupabaseConfigured(env)) return createSupabaseAuthService(env.url!.trim(), env.anonKey!.trim());
  try {
    const storage = demoStorage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (storage && storage.getItem(DEMO_AUTH_KEY) !== null) return new DemoAuthService(storage);
  } catch {
    // browser senza memoria: nessuna modalità dimostrativa
  }
  return null;
}
