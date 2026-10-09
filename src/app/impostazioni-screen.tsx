"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PageTitle } from "./components/page-title";
import { settingsTitle, SettingsView } from "./components/settings-view";
import { sectionFromParam, sectionHref } from "./lib/settings-sections";

/**
 * Indirizzo diretto delle Impostazioni (`/impostazioni`, `?s=…`): le stesse pagine del pannello, a schermo intero.
 * Nell'app si aprono dall'ingranaggio di Oggi e Settimana.
 */
export function ImpostazioniScreen() {
  const router = useRouter();
  const section = sectionFromParam(useSearchParams().get("s"));
  return (
    <main>
      {section !== null && (
        <button type="button" onClick={() => router.push("/impostazioni")} className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 pt-2 text-[17px] font-semibold text-accent">
          <span aria-hidden="true">‹</span> Indietro
        </button>
      )}
      <PageTitle>{settingsTitle(section)}</PageTitle>
      <SettingsView section={section} onNavigate={(s) => router.push(s === null ? "/impostazioni" : sectionHref(s))} />
    </main>
  );
}
