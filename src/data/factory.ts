import { createBrowserDataStore } from "./browser";
import { createSupabaseDataStore } from "./supabase-client";
import type { DataStore } from "./store";

export interface SupabaseEnv {
  url: string | undefined;
  anonKey: string | undefined;
}

/** Le due variabili d'ambiente di Supabase, lette in modo che Next le inserisca nell'app al momento della costruzione. */
export function readSupabaseEnv(): SupabaseEnv {
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
}

/** Supabase è configurato solo se ci sono entrambe le variabili (non vuote). */
export function isSupabaseConfigured(env: SupabaseEnv = readSupabaseEnv()): boolean {
  return Boolean(env.url?.trim()) && Boolean(env.anonKey?.trim());
}

/** Sceglie lo sportello: Supabase se configurato, altrimenti il browser (come prima). */
export function createDataStore(env: SupabaseEnv = readSupabaseEnv()): DataStore {
  return isSupabaseConfigured(env) ? createSupabaseDataStore(env.url!.trim(), env.anonKey!.trim()) : createBrowserDataStore();
}
