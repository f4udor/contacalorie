"use client";

import { useState } from "react";
import { PageTitle } from "./components/page-title";
import { SettingsForm } from "./components/settings-form";
import { useDataStore } from "./data-provider";
import { useToday } from "./lib/use-today";
import { useUserSettings } from "./lib/use-user-settings";

/** Schermata Impostazioni. */
export function ImpostazioniScreen() {
  const store = useDataStore();
  const today = useToday();
  const { loaded, reload } = useUserSettings();
  const [formKey, setFormKey] = useState(0);

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
    </main>
  );
}
