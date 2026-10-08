/** Chi è collegato. */
export interface AuthSession {
  email: string;
}

export type AuthErrorCode = "email" | "codice" | "limite" | "rete";

/** Errore di accesso con un messaggio già pronto da mostrare. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: AuthErrorCode,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  email: "Scrivi un indirizzo email valido.",
  codice: "Il codice non è corretto o è scaduto. Controlla l'email o chiedine uno nuovo.",
  limite: "Hai chiesto troppi codici: aspetta un minuto e riprova.",
  rete: "Non riesco a collegarmi: controlla la connessione e riprova.",
};

/** Accesso con email e codice di 6 cifre. */
export interface AuthService {
  /** "supabase": accesso vero; "demo": finto locale per provare le schermate (solo senza Supabase). */
  readonly kind: "supabase" | "demo";
  getSession(): Promise<AuthSession | null>;
  /** Manda il codice all'email. */
  requestCode(email: string): Promise<void>;
  /** Controlla il codice e apre la sessione. */
  verifyCode(email: string, code: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  /** Avvisa quando la sessione cambia (accesso, uscita, scadenza). Restituisce la funzione per smettere. */
  onChange(listener: (session: AuthSession | null) => void): () => void;
}

export const CODE_LENGTH = 6;

/** Tiene solo le cifre (il codice si copia spesso con spazi o trattini). */
export function normalizeCode(text: string): string {
  return text.replace(/\D/g, "");
}

export function isValidCode(text: string): boolean {
  return normalizeCode(text).length === CODE_LENGTH;
}

export function normalizeEmail(text: string): string {
  return text.trim().toLowerCase();
}

export function isValidEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(text));
}

// --- Supabase

interface AuthErrorLike {
  message: string;
  status?: number;
  code?: string;
}

/** La parte del client Supabase che serve all'accesso (permette un finto nei test). */
export interface SupabaseAuthLike {
  auth: {
    getSession(): Promise<{ data: { session: { user: { email?: string | null } } | null } }>;
    signInWithOtp(params: { email: string; options?: { shouldCreateUser?: boolean } }): Promise<{ error: AuthErrorLike | null }>;
    verifyOtp(params: { email: string; token: string; type: "email" }): Promise<{ data: { session: { user: { email?: string | null } } | null }; error: AuthErrorLike | null }>;
    signOut(): Promise<{ error: AuthErrorLike | null }>;
    onAuthStateChange(callback: (event: string, session: { user: { email?: string | null } } | null) => void): { data: { subscription: { unsubscribe(): void } } };
  };
}

function toSession(s: { user: { email?: string | null } } | null): AuthSession | null {
  return s ? { email: s.user.email ?? "" } : null;
}

function mapError(e: AuthErrorLike | null, fallback: AuthErrorCode): AuthError {
  if (e?.status === 429 || /rate limit|too many|after \d+ seconds/i.test(e?.message ?? "")) return new AuthError(AUTH_MESSAGES.limite, "limite");
  return new AuthError(AUTH_MESSAGES[fallback], fallback);
}

export class SupabaseAuthService implements AuthService {
  readonly kind = "supabase" as const;
  constructor(private readonly getClient: () => Promise<SupabaseAuthLike>) {}

  private async call<T>(fn: (c: SupabaseAuthLike) => Promise<T>): Promise<T> {
    let client: SupabaseAuthLike;
    try {
      client = await this.getClient();
      return await fn(client);
    } catch (e) {
      if (e instanceof AuthError) throw e;
      throw new AuthError(AUTH_MESSAGES.rete, "rete");
    }
  }

  async getSession() {
    try {
      return await this.call(async (c) => toSession((await c.auth.getSession()).data.session));
    } catch {
      return null; // senza rete la sessione salvata non si legge: si ricomincia dall'accesso
    }
  }

  async requestCode(email: string) {
    if (!isValidEmail(email)) throw new AuthError(AUTH_MESSAGES.email, "email");
    await this.call(async (c) => {
      const { error } = await c.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: true } });
      if (error) throw mapError(error, "rete");
    });
  }

  async verifyCode(email: string, code: string) {
    if (!isValidCode(code)) throw new AuthError(AUTH_MESSAGES.codice, "codice");
    return this.call(async (c) => {
      const { data, error } = await c.auth.verifyOtp({ email: normalizeEmail(email), token: normalizeCode(code), type: "email" });
      const session = toSession(data.session);
      if (error || !session) throw mapError(error, "codice");
      return session;
    });
  }

  async signOut() {
    await this.call(async (c) => {
      const { error } = await c.auth.signOut();
      if (error) throw mapError(error, "rete");
    });
  }

  onChange(listener: (session: AuthSession | null) => void) {
    let unsubscribe: (() => void) | null = null;
    let stopped = false;
    this.getClient()
      .then((c) => {
        if (stopped) return;
        unsubscribe = c.auth.onAuthStateChange((_event, s) => listener(toSession(s))).data.subscription.unsubscribe;
      })
      .catch(() => {});
    return () => {
      stopped = true;
      unsubscribe?.();
    };
  }
}

// --- Modalità dimostrativa (senza Supabase)

/** Dove la modalità dimostrativa tiene la sessione finta; se la chiave non c'è, nessun accesso viene richiesto. */
export const DEMO_AUTH_KEY = "personal-health:demo-auth";
export const DEMO_CODE = "123456";

interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Accesso finto per provare le schermate senza Supabase: accetta qualsiasi email e il codice 123456.
 * Si attiva solo se in `storage` esiste la chiave dimostrativa e Supabase non è configurato.
 */
export class DemoAuthService implements AuthService {
  readonly kind = "demo" as const;
  private listeners = new Set<(s: AuthSession | null) => void>();
  constructor(private readonly storage: DemoStorage) {}

  private read(): AuthSession | null {
    try {
      const v = JSON.parse(this.storage.getItem(DEMO_AUTH_KEY) ?? "null") as { session?: AuthSession | null } | null;
      return v?.session ?? null;
    } catch {
      return null;
    }
  }
  private write(session: AuthSession | null) {
    this.storage.setItem(DEMO_AUTH_KEY, JSON.stringify({ session }));
    for (const l of this.listeners) l(session);
  }

  async getSession() {
    return this.read();
  }
  async requestCode(email: string) {
    if (!isValidEmail(email)) throw new AuthError(AUTH_MESSAGES.email, "email");
  }
  async verifyCode(email: string, code: string) {
    if (normalizeCode(code) !== DEMO_CODE) throw new AuthError(AUTH_MESSAGES.codice, "codice");
    const session = { email: normalizeEmail(email) };
    this.write(session);
    return session;
  }
  async signOut() {
    this.write(null);
  }
  onChange(listener: (s: AuthSession | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
