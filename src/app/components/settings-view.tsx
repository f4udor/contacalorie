"use client";

import { resolveSettings } from "@/engine";
import { ActivityPage, DataPage, FreeMealPage, GoalsPage, LinksPage, ProfilePage } from "./settings-pages";
import { SettingsList } from "./settings-list";
import { Sheet } from "./sheet";
import { useAuth } from "../auth-provider";
import { useDataStore } from "../data-provider";
import { useHealthLink } from "../lib/use-health-link";
import { rowSummaries, SECTIONS } from "../lib/settings-sections";
import type { SectionId } from "../lib/settings-sections";
import { useToday } from "../lib/use-today";
import { useUserSettings } from "../lib/use-user-settings";
import { latestWeighInWeight } from "../lib/week-data";

/**
 * Il contenuto delle Impostazioni: l'elenco delle pagine, oppure la pagina scelta. Lo usano sia il pannello aperto dall'ingranaggio
 * sia l'indirizzo diretto `/impostazioni`; chi lo usa dice qual è la pagina e cosa fare per cambiarla.
 */
export function SettingsView({ section, onNavigate }: { section: SectionId | null; onNavigate: (section: SectionId | null) => void }) {
  const store = useDataStore();
  const today = useToday();
  const { loaded, reload } = useUserSettings();
  const { link } = useHealthLink();
  const { email, signOut } = useAuth();

  if (section === null) {
    const weightKg = loaded && today ? (latestWeighInWeight(loaded.weighIns, today) ?? loaded.settings.weightKg ?? null) : null;
    const resolved = loaded && today ? resolveSettings(loaded.settings as Record<string, unknown>, today, weightKg) : null;
    return (
      <>
        {loaded && resolved && (
          <SettingsList
            onOpen={onNavigate}
            summaries={rowSummaries({ user: loaded.settings, settings: resolved.settings, profileComplete: resolved.plan !== null, weightKg, healthLinked: link === null ? null : link.active })}
          />
        )}
        {email !== null && signOut && (
          <section className="mt-6 rounded-2xl bg-card p-4" aria-label="Account">
            <p className="break-all text-[17px] font-semibold">{email}</p>
            <button type="button" onClick={() => signOut()} className="mt-4 min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad">
              Esci
            </button>
          </section>
        )}
      </>
    );
  }

  const pageProps = store && today && loaded ? { store, settings: loaded.settings, weighIns: loaded.weighIns, today, onChanged: reload, onNavigate } : null;
  return (
    <>
      {section === "collegamenti" && <LinksPage />}
      {section === "dati" && store && <DataPage store={store} onChanged={reload} />}
      {pageProps && section === "profilo" && <ProfilePage {...pageProps} />}
      {pageProps && section === "obiettivi" && <GoalsPage {...pageProps} />}
      {pageProps && section === "attivita" && <ActivityPage {...pageProps} />}
      {pageProps && section === "pasto-libero" && <FreeMealPage {...pageProps} />}
    </>
  );
}

/** Il titolo della pagina di Impostazioni (o «Impostazioni» per l'elenco). */
export const settingsTitle = (section: SectionId | null): string => (section === null ? "Impostazioni" : (SECTIONS.find((s) => s.id === section)?.title ?? "Impostazioni"));

/** Pannello delle Impostazioni, aperto dall'ingranaggio di Oggi e Settimana: X nell'elenco, freccia ‹ nelle pagine. */
export function SettingsPanel({ section, onSectionChange, onClose }: { section: SectionId | null; onSectionChange: (s: SectionId | null) => void; onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title={settingsTitle(section)} back={section === null ? undefined : () => onSectionChange(null)}>
      <SettingsView section={section} onNavigate={onSectionChange} />
    </Sheet>
  );
}
