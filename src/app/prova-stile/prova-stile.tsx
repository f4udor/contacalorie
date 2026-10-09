"use client";

import { useState, useSyncExternalStore } from "react";
import { PageTitle } from "../components/page-title";
import { IconBars, IconChevronLeft, IconChevronRight, IconGear, IconLine, IconNow, IconPlus, IconRing, IconTrash, IconX } from "../components/ui/icons";
import { ActionRow, Card, CircleButton, GroupedList, Num, PillButton, Segmented, SheetHeader, Tile, ValueRow } from "../components/ui/ui";
import { ROLE_BG, ROLE_USE, ROLES, roleVar } from "../lib/roles";

const subscribeNever = () => () => {};

/** Il valore di un colore come lo vede il browser, letto dalla variabile di stile (nessun valore scritto qui). */
function useCssValue(role: string): string {
  return useSyncExternalStore(
    subscribeNever,
    () => getComputedStyle(document.documentElement).getPropertyValue(`--${role}`).trim(),
    () => "",
  );
}

function Swatch({ role }: { role: (typeof ROLES)[number] }) {
  const value = useCssValue(role);
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden="true" className={`size-10 shrink-0 rounded-full border border-separatore ${ROLE_BG[role]}`} />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">
          {role} <span className="font-normal text-testo-secondario">{value}</span>
        </span>
        <span className="block text-[13px] text-testo-secondario">
          <code>{roleVar(role)}</code> · {ROLE_USE[role]}
        </span>
      </span>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-testo-secondario">{title}</h2>
      {children}
    </section>
  );
}

export function ProvaStile() {
  const [mode, setMode] = useState<"ai" | "manuale">("manuale");
  return (
    <main className="flex flex-col gap-6 pb-10">
      <PageTitle>Prova stile</PageTitle>

      <Section title="Colori (§10.2)">
        <Card>
          <ul className="flex flex-col gap-3">
            {ROLES.map((r) => (
              <Swatch key={r} role={r} />
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Numero con unità">
        <Card title="Numeri">
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <Num value="39" unit="kcal" size="xl" tone="in-obiettivo" />
            <Num value="12,4" unit="km" size="lg" tone="bici" />
            <Num value="6.480" size="lg" tone="passi" />
            <Num value="2.070" unit="kcal" size="md" />
            <Num value="98,6" unit="kg" size="sm" />
          </div>
        </Card>
      </Section>

      <Section title="Scheda, tessera">
        <Card title="Pranzo" aside={<Num value="1.150" unit="kcal" size="sm" />}>
          <div className="mt-3 flex flex-col gap-2">
            <Tile className="flex items-center justify-between gap-3 px-3.5 py-3">
              <span className="min-w-0">
                <span className="block text-[16px]">Polpette di maiale al sugo</span>
                <span className="block truncate text-[13px] text-testo-secondario">200 g carne, 10 g pangrattato, 300 g salsa</span>
              </span>
              <span className="font-cifre text-[17px] tabular-nums">720</span>
            </Tile>
            <button type="button" className="min-h-11 text-left text-[15px] font-semibold text-comando">
              + Aggiungi piatto
            </button>
          </div>
        </Card>
        <Card title="Passi" onOpen={() => undefined} openLabel="Apri Passi">
          <p className="mt-1 text-[13px] text-testo-secondario">Media</p>
          <Num value="6.480" size="lg" tone="passi" />
        </Card>
      </Section>

      <Section title="Elenco raggruppato: tre tipi di riga">
        <GroupedList>
          <ValueRow title="Profilo" value="98,6 kg → 90 kg" href="/prova-stile" />
          <ValueRow title="Stato" value="Attiva" />
          <ActionRow label="Esporta i dati" onClick={() => undefined} />
          <ActionRow label="Esci" tone="fuori" onClick={() => undefined} />
        </GroupedList>
      </Section>

      <Section title="Tasto a pillola (normale e pieno)">
        <PillButton onClick={() => undefined}>Stima con l&apos;AI</PillButton>
        <PillButton filled onClick={() => undefined}>
          Aggiungi uscita in bici
        </PillButton>
      </Section>

      <Section title="Intestazione dei pannelli">
        <div className="rounded-scheda bg-pannello p-3">
          <SheetHeader title="Modifica piatto" onClose={() => undefined} action={{ label: "Salva", onClick: () => undefined }} />
        </div>
        <div className="rounded-scheda bg-pannello p-3">
          <SheetHeader title="Aggiungi" onClose={() => undefined} action={{ label: "Salva", disabled: true }} />
        </div>
        <div className="rounded-scheda bg-pannello p-3">
          <SheetHeader title="Collegamenti" closeKind="back" onClose={() => undefined} />
        </div>
      </Section>

      <Section title="Selettore a segmenti">
        <Segmented
          label="Modo di inserimento"
          value={mode}
          onChange={setMode}
          options={[
            { value: "ai", label: "AI" },
            { value: "manuale", label: "Manuale" },
          ]}
        />
      </Section>

      <Section title="Freccia nel cerchietto e tasti tondi">
        <Card>
          <div className="flex items-center gap-2">
            <CircleButton label="Indietro" onClick={() => undefined}>
              <IconChevronLeft size={16} />
            </CircleButton>
            <CircleButton label="Torna a oggi" tone="comando" onClick={() => undefined}>
              <IconNow size={18} />
            </CircleButton>
            <CircleButton label="Torna a oggi" disabled>
              <IconNow size={18} />
            </CircleButton>
            <CircleButton label="Avanti" onClick={() => undefined}>
              <IconChevronRight size={16} />
            </CircleButton>
            <CircleButton label="Impostazioni" onClick={() => undefined}>
              <IconGear size={18} />
            </CircleButton>
          </div>
        </Card>
      </Section>

      <Section title="Icone">
        <Card>
          <div className="flex flex-wrap items-center gap-5 text-testo">
            <IconRing size={26} />
            <IconBars size={26} />
            <IconLine size={26} />
            <IconGear size={26} />
            <IconX size={26} />
            <IconPlus size={26} />
            <IconTrash size={26} />
            <IconNow size={26} />
          </div>
        </Card>
      </Section>
    </main>
  );
}
