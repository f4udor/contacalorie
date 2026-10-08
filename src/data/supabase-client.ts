import { SupabaseDataStore } from "./supabase";
import type { SupabaseLike } from "./supabase";
import type { DataStore } from "./store";

/** Sportello su Supabase con il client vero, caricato solo quando serve (una volta). */
export function createSupabaseDataStore(url: string, anonKey: string): DataStore {
  let client: Promise<SupabaseLike> | null = null;
  const getClient = () =>
    (client ??= import("@supabase/supabase-js").then(({ createClient }) => createClient(url, anonKey) as unknown as SupabaseLike));
  return new SupabaseDataStore(getClient);
}
