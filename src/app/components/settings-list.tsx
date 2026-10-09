import { SECTIONS } from "../lib/settings-sections";
import type { SectionId } from "../lib/settings-sections";

const chevron = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

function Row({ id, title, summary, onOpen }: { id: SectionId; title: string; summary: string; onOpen: (id: SectionId) => void }) {
  return (
    <button type="button" onClick={() => onOpen(id)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left">
      <span className="text-[17px] font-semibold">{title}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[17px] text-muted">{summary}</span>
        {chevron}
      </span>
    </button>
  );
}

/** Prima pagina di Impostazioni: solo righe che aprono le pagine, ciascuna con un riassunto; Collegamenti staccata in fondo. Nessun campo modificabile. */
export function SettingsList({ summaries, onOpen }: { summaries: Record<SectionId, string>; onOpen: (id: SectionId) => void }) {
  const main = SECTIONS.filter((s) => s.id !== "collegamenti");
  const links = SECTIONS.find((s) => s.id === "collegamenti")!;
  return (
    <nav aria-label="Impostazioni" className="flex flex-col gap-6">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card">
        {main.map((s) => (
          <li key={s.id}>
            <Row id={s.id} title={s.title} summary={summaries[s.id]} onOpen={onOpen} />
          </li>
        ))}
      </ul>
      <div className="overflow-hidden rounded-2xl bg-card">
        <Row id={links.id} title={links.title} summary={summaries[links.id]} onOpen={onOpen} />
      </div>
    </nav>
  );
}
