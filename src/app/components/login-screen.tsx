"use client";

import { useState } from "react";
import { AuthError, CODE_LENGTH, isValidCode, isValidEmail, normalizeEmail } from "@/data";
import type { AuthService, AuthSession } from "@/data";
import { Caption, FieldRow, GroupedList, PillButton, RowInput } from "./ui/ui";

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

  const message = error ?? info;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Accedi</h1>
        <p className="mt-1 text-[17px] text-testo-secondario">
          {step === "email" ? "Ti mandiamo un codice di 6 cifre." : `Inserisci il codice che trovi nell'email inviata a ${normalizeEmail(email)}.`}
        </p>
      </header>

      {step === "email" ? (
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-3">
          <GroupedList>
            <FieldRow label="Email" htmlFor="login-email" error={error}>
              <RowInput id="login-email" value={email} onChange={setEmail} inputMode="text" kind="email" invalid={Boolean(error)} />
            </FieldRow>
          </GroupedList>
          <PillButton filled type="submit" disabled={busy}>
            Invia il codice
          </PillButton>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-3">
          <GroupedList>
            <FieldRow label="Codice" htmlFor="login-code" error={error}>
              <RowInput id="login-code" value={code} onChange={setCode} inputMode="numeric" kind="codice" invalid={Boolean(error)} />
            </FieldRow>
          </GroupedList>
          {!error && message && <Caption>{message}</Caption>}
          <PillButton filled type="submit" disabled={busy}>
            Accedi
          </PillButton>
          <PillButton disabled={busy} onClick={() => sendCode()}>
            Invia un nuovo codice
          </PillButton>
          <PillButton
            disabled={busy}
            onClick={() => {
              setStep("email");
              setError(undefined);
              setInfo(undefined);
            }}
          >
            Cambia email
          </PillButton>
        </form>
      )}
    </main>
  );
}
