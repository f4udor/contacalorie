import { SupabaseAuthService } from "./auth";
import type { AuthService, SupabaseAuthLike } from "./auth";
import { SupabaseDataStore } from "./supabase";
import type { SupabaseLike } from "./supabase";
import type { DataStore } from "./store";

type Client = SupabaseLike & SupabaseAuthLike;

// Un solo client per tutta l'app (dati e accesso condividono la sessione), caricato solo quando serve.
let shared: { key: string; client: Promise<Client> } | null = null;

function getSharedClient(url: string, anonKey: string): Promise<Client> {
  const key = `${url}|${anonKey}`;
  if (!shared || shared.key !== key) {
    shared = { key, client: import("@supabase/supabase-js").then(({ createClient }) => createClient(url, anonKey) as unknown as Client) };
  }
  return shared.client;
}

/** Sportello su Supabase con il client vero. */
export function createSupabaseDataStore(url: string, anonKey: string): DataStore {
  return new SupabaseDataStore(() => getSharedClient(url, anonKey));
}

/** Accesso con email e codice su Supabase, con lo stesso client dello sportello. */
export function createSupabaseAuthService(url: string, anonKey: string): AuthService {
  return new SupabaseAuthService(() => getSharedClient(url, anonKey));
}
