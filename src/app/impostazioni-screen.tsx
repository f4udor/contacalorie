"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft } from "./components/ui/icons";
import { CircleButton } from "./components/ui/ui";
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
        <div className="pt-2">
          <CircleButton label="Indietro" onClick={() => router.push("/impostazioni")}>
            <IconChevronLeft size={18} />
          </CircleButton>
        </div>
      )}
      <PageTitle>{settingsTitle(section)}</PageTitle>
      <SettingsView section={section} onNavigate={(s) => router.push(s === null ? "/impostazioni" : sectionHref(s))} />
    </main>
  );
}
