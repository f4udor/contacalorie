import { createSupabaseHealthGate, isSupabaseConfigured, readSupabaseEnv } from "@/data";
import { handleHealthIngest } from "@/modules/activity";
import type { HealthGate } from "@/modules/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

function readGate(): HealthGate | null {
  const env = readSupabaseEnv();
  return isSupabaseConfigured(env) ? createSupabaseHealthGate(env.url!.trim(), env.anonKey!.trim()) : null;
}

/** Ingresso dei dati da Salute (passi e km in bici), chiamato da un Comando rapido con il codice personale. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const outcome = await handleHealthIngest({ gate: readGate(), now: new Date() }, request.headers.get("authorization"), body);
  return Response.json(outcome.body, { status: outcome.status, headers: noStore });
}
