type Fetch = (url: string, init?: { headers: Record<string, string> }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/** Il giorno di Roma (AAAA-MM-GG): è quello su cui il database conta le stime (BRIEF §4). */
export function romeDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * Le stime già fatte oggi dall'utente del token, lette dal contatore (`ai_usage`, che le sue regole di sicurezza gli lasciano leggere).
 * Zero se oggi non ne ha fatte; null se non si riesce a leggere (rete, token scaduto).
 */
export async function fetchUsedToday(opts: { url: string; anonKey: string; token: string; now?: Date; doFetch?: Fetch }): Promise<number | null> {
  const doFetch = opts.doFetch ?? (fetch as unknown as Fetch);
  try {
    const day = romeDay(opts.now ?? new Date());
    const res = await doFetch(`${opts.url.replace(/\/+$/, "")}/rest/v1/ai_usage?select=count&day=eq.${day}`, {
      headers: { apikey: opts.anonKey, Authorization: `Bearer ${opts.token}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as unknown;
    if (!Array.isArray(rows)) return null;
    const count = rows.length === 0 ? 0 : Number((rows[0] as { count?: unknown }).count);
    return Number.isFinite(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}
