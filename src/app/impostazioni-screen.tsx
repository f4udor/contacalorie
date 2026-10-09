"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resolveSettings } from "@/engine";
import { ActivityPage, DataPage, FreeMealPage, GoalsPage, LinksPage, ProfilePage } from "./components/settings-pages";
import { PageTitle } from "./components/page-title";
import { SettingsList } from "./components/settings-list";
import { useAuth } from "./auth-provider";
import { useDataStore } from "./data-provider";
import { useHealthLink } from "./lib/use-health-link";
import { rowSummaries, SECTIONS, sectionFromParam } from "./lib/settings-sections";
import { useToday } from "./lib/use-today";
import { useUserSettings } from "./lib/use-user-settings";
import { latestWeighInWeight } from "./lib/week-data";

/** Schermata Impostazioni: l'elenco delle pagine, oppure la pagina scelta (`?s=…`) con «Indietro». */
export function ImpostazioniScreen() {
  const store = useDataStore();
  const today = useToday();
  const section = sectionFromParam(useSearchParams().get("s"));
  const { loaded, reload } = useUserSettings();
  const { link } = useHealthLink();
  const { email, signOut } = useAuth();

  if (section === null) {
    const weightKg = loaded && today ? (latestWeighInWeight(loaded.weighIns, today) ?? loaded.settings.weightKg ?? null) : null;
    const resolved = loaded && today ? resolveSettings(loaded.settings as Record<string, unknown>, today, weightKg) : null;
    return (
      <main>
        <PageTitle>Impostazioni</PageTitle>
        {loaded && resolved && (
          <SettingsList
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
      </main>
    );
  }

  const title = SECTIONS.find((s) => s.id === section)!.title;
  const pageProps = store && today && loaded ? { store, settings: loaded.settings, weighIns: loaded.weighIns, today, onChanged: reload } : null;
  return (
    <main>
      <Link href="/impostazioni" className="-ml-2 flex min-h-11 w-fit items-center gap-1 px-2 pt-2 text-[17px] font-semibold text-accent">
        <span aria-hidden="true">‹</span> Indietro
      </Link>
      <PageTitle>{title}</PageTitle>
      {section === "collegamenti" && <LinksPage />}
      {section === "dati" && store && <DataPage store={store} onChanged={reload} />}
      {pageProps && section === "profilo" && <ProfilePage {...pageProps} />}
      {pageProps && section === "obiettivi" && <GoalsPage {...pageProps} />}
      {pageProps && section === "attivita" && <ActivityPage {...pageProps} />}
      {pageProps && section === "pasto-libero" && <FreeMealPage {...pageProps} />}
    </main>
  );
}
