"use client";

import { useState } from "react";
import { AuthError, CODE_LENGTH, isValidCode, isValidEmail, normalizeEmail } from "@/data";
import type { AuthService, AuthSession } from "@/data";
import { TextField } from "./field";

const primary = "min-h-12 w-full rounded-xl bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";
const secondary = "min-h-11 rounded-xl px-3 text-[15px] font-semibold text-accent disabled:opacity-50";

/** Schermata "Accedi": prima l'email, poi il codice di 6 cifre ricevuto per email. */
export function LoginScreen({ service, onSession }: { service: AuthService; onSession: (s: AuthSession) => void }) {
  const [step, setStep] = useState<"email" | "codice">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => setError(e instanceof AuthError ? e.message : "Qualcosa non ha funzionato: riprova.");

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail(email)) {
      setError("Scrivi un indirizzo email valido.");
      return;
    }
    setError(undefined);
    setInfo(undefined);
    setBusy(true);
    try {
      await service.requestCode(email);
      setStep("codice");
      setCode("");
      setInfo(`Ti abbiamo mandato un codice di ${CODE_LENGTH} cifre.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCode(code)) {
      setError(`Il codice ha ${CODE_LENGTH} cifre.`);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      onSession(await service.verifyCode(email, code));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Accedi</h1>
        <p className="mt-1 text-[17px] text-muted">
          {step === "email" ? "Scrivi la tua email: ti mandiamo un codice di 6 cifre. Niente password." : `Inserisci il codice che trovi nell'email inviata a ${normalizeEmail(email)}.`}
        </p>
      </header>

      {step === "email" ? (
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-4 rounded-2xl bg-card p-4">
          <TextField id="login-email" label="Email" value={email} onChange={setEmail} inputMode="email" error={error} />
          <button type="submit" disabled={busy} className={primary}>
            Invia il codice
          </button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-4 rounded-2xl bg-card p-4">
          <TextField id="login-code" label="Codice" value={code} onChange={setCode} inputMode="numeric" error={error} hint={info} />
          <button type="submit" disabled={busy} className={primary}>
            Accedi
          </button>
          <div className="flex flex-wrap justify-between gap-1">
            <button type="button" disabled={busy} onClick={() => { setStep("email"); setError(undefined); setInfo(undefined); }} className={secondary}>
              Cambia email
            </button>
            <button type="button" disabled={busy} onClick={() => sendCode()} className={secondary}>
              Invia un nuovo codice
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
