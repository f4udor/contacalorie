"use client";

import { useState } from "react";
import { PageTitle } from "./components/page-title";
import { SettingsForm } from "./components/settings-form";
import { useAuth } from "./auth-provider";
import { useDataStore } from "./data-provider";
import { useToday } from "./lib/use-today";
import { useUserSettings } from "./lib/use-user-settings";

/** Schermata Impostazioni. */
export function ImpostazioniScreen() {
  const store = useDataStore();
  const today = useToday();
  const { loaded, reload } = useUserSettings();
  const [formKey, setFormKey] = useState(0);
  const { email, signOut } = useAuth();

  return (
    <main>
      <PageTitle>Impostazioni</PageTitle>
      {store && today && loaded && (
        <SettingsForm
          key={formKey}
          store={store}
          settings={loaded.settings}
          weighIns={loaded.weighIns}
          today={today}
          onChanged={(reset) => {
            reload();
            if (reset) setFormKey((k) => k + 1);
          }}
        />
      )}
      {email !== null && signOut && (
        <section className="mt-3 rounded-2xl bg-card p-4" aria-label="Account">
          <h2 className="text-[22px] font-bold leading-tight">Account</h2>
          <p className="mb-4 mt-1 text-sm text-muted">L&apos;account con cui hai effettuato l&apos;accesso su questo dispositivo.</p>
          <p className="break-all text-[17px] font-semibold">{email}</p>
          <button type="button" onClick={() => signOut()} className="mt-4 min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad">
            Esci
          </button>
        </section>
      )}
    </main>
  );
}
