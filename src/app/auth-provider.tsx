"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createAuthService } from "@/data";
import type { AuthService, AuthSession } from "@/data";
import { LoginScreen } from "./components/login-screen";

interface AuthValue {
  /** Email dell'account collegato; null se l'accesso non è richiesto (Supabase non configurato). */
  email: string | null;
  signOut: (() => Promise<void>) | null;
  /** "supabase" = accesso vero; "demo" = accesso finto solo per gli screenshot; null = nessun accesso richiesto. */
  kind: "supabase" | "demo" | null;
  /** Chiave di accesso da mandare al server per le stime AI; null se l'accesso non è richiesto o non c'è. */
  getAccessToken: (() => Promise<string | null>) | null;
}

const AuthContext = createContext<AuthValue>({ email: null, signOut: null, kind: null, getAccessToken: null });

/** Account collegato e uscita, solo quando l'accesso è attivo. */
export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

// Il servizio di accesso è uno solo; sul server non esiste (undefined), nel browser è null se non serve l'accesso.
let service: AuthService | null | undefined;
function getService(): AuthService | null {
  if (service === undefined) service = createAuthService();
  return service;
}
const subscribeNever = () => () => {};

/**
 * Mostra la schermata "Accedi" finché non c'è una sessione, ma solo se Supabase è configurato:
 * altrimenti non cambia nulla e l'app si apre subito, con i dati del browser.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useSyncExternalStore(subscribeNever, getService, () => undefined);
  // undefined = non ancora letta
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) return;
    let alive = true;
    auth.getSession().then((s) => alive && setSession(s));
    const stop = auth.onChange((s) => alive && setSession(s));
    return () => {
      alive = false;
      stop();
    };
  }, [auth]);

  if (auth === undefined) return null; // ancora sul server: non si sa se serve l'accesso
  if (auth === null) return <>{children}</>;
  if (session === undefined) return <div aria-busy="true" className="min-h-dvh" />;
  if (session === null) return <LoginScreen service={auth} onSession={setSession} />;
  return <AuthContext.Provider value={{ email: session.email, signOut: () => auth.signOut(), kind: auth.kind, getAccessToken: () => auth.getAccessToken() }}>{children}</AuthContext.Provider>;
}
