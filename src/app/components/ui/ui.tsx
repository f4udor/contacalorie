"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROLE_TEXT } from "../../lib/roles";
import type { Role } from "../../lib/roles";
import { IconChevronLeft, IconChevronRight, IconX } from "./icons";

/*
 * Componenti condivisi di BRIEF §10.3. Colori, raggi e caratteri vengono solo dalle variabili di `globals.css`.
 */

/** Cerchietto grigio con una freccia, in alto a destra di una scheda che si apre. */
export function ChevronCircle() {
  return (
    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-cerchio-freccia text-testo">
      <IconChevronRight size={14} strokeWidth={2.6} />
    </span>
  );
}

interface CardProps {
  /** Titolo in alto a sinistra. */
  title?: ReactNode;
  /** Se c'è, la scheda si apre: tutta la scheda è un tasto e in alto a destra c'è il cerchietto con la freccia. */
  onOpen?: () => void;
  /** Nome per la lettura vocale del tasto di una scheda che si apre. */
  openLabel?: string;
  /** Contenuto a destra del titolo (per esempio una legenda); non vale per le schede che si aprono. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Scheda: raggio 24 px, margine interno 16 px, opaca e senza bordo. */
export function Card({ title, onOpen, openLabel, aside, className = "", children }: CardProps) {
  const head =
    title !== undefined || aside !== undefined || onOpen ? (
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold leading-tight">{title}</h2>
        {onOpen ? <ChevronCircle /> : aside}
      </div>
    ) : null;
  const base = `w-full min-w-0 rounded-scheda bg-scheda p-4 text-left ${className}`;
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} aria-label={openLabel} className={`block ${base}`}>
        {head}
        {children}
      </button>
    );
  }
  return (
    <section className={base}>
      {head}
      {children}
    </section>
  );
}

/** Tessera: raggio 16 px, sta dentro una scheda o un pannello (un piatto, una riga). */
export function Tile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-tessera bg-tessera ${className}`}>{children}</div>;
}

/** Elenco raggruppato: righe in un contenitore con raggio 22 px, separate da una linea sottile. */
export function GroupedList({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ul aria-label={label} className={`divide-y divide-separatore overflow-hidden rounded-elenco bg-tessera ${className}`}>
      {children}
    </ul>
  );
}

const ROW = "flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[17px]";

interface RowAction {
  href?: string;
  onClick?: () => void;
}

function RowShell({ href, onClick, className, children }: RowAction & { className: string; children: ReactNode }) {
  if (href) return <Link href={href} className={className}>{children}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={className}>{children}</button>;
  return <div className={className}>{children}</div>;
}

/**
 * Riga bianca con il valore grigio a destra. Con `href` o `onClick` apre una pagina o un pannello e mostra la freccia;
 * senza è solo un'informazione.
 */
export function ValueRow({ title, sub, value, href, onClick }: RowAction & { title: ReactNode; sub?: ReactNode; value?: ReactNode }) {
  const opens = Boolean(href || onClick);
  return (
    <li>
      <RowShell href={href} onClick={onClick} className={ROW}>
        <span className="min-w-0">
          <span className="block">{title}</span>
          {sub && <span className="block text-[13px] text-testo-secondario">{sub}</span>}
        </span>
        <span className="flex min-w-0 shrink-0 items-center gap-1.5 text-testo-secondario">
          {value !== undefined && <span className="min-w-0 truncate text-right text-[16px]">{value}</span>}
          {opens && <IconChevronRight size={16} strokeWidth={2.4} />}
        </span>
      </RowShell>
    </li>
  );
}

/** Riga nel colore Comando, senza freccia: esegue un'azione. Con `tone="fuori"` è distruttiva («Elimina», «Esci»). */
export function ActionRow({ label, tone = "comando", href, onClick, disabled }: RowAction & { label: ReactNode; tone?: Extract<Role, "comando" | "fuori">; disabled?: boolean }) {
  const cls = `${ROW} ${ROLE_TEXT[tone]} font-medium disabled:opacity-50`;
  return (
    <li>
      {href ? (
        <Link href={href} className={cls}>
          {label}
        </Link>
      ) : (
        <button type="button" onClick={onClick} disabled={disabled} className={cls}>
          {label}
        </button>
      )}
    </li>
  );
}

interface PillProps extends RowAction {
  children: ReactNode;
  /** Il tasto pieno (fondo Comando, testo nero): uno solo per pannello, l'azione principale. */
  filled?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
  className?: string;
}

/** Tasto a pillola, largo quanto il contenitore: fondo Tessera con testo Comando, oppure pieno. */
export function PillButton({ children, filled = false, disabled, type = "button", form, href, onClick, className = "" }: PillProps) {
  const cls = `flex min-h-12 w-full items-center justify-center rounded-full px-5 text-[17px] font-semibold disabled:opacity-50 ${
    filled ? "bg-comando text-testo-su-comando" : "bg-tessera text-comando"
  } ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** Tasto tondo con un'icona (frecce delle intestazioni, ingranaggio): 32 px visibili dentro un'area toccabile di 44 px. */
export function CircleButton({ label, children, onClick, href, disabled, tone = "testo" }: RowAction & { label: string; children: ReactNode; disabled?: boolean; tone?: Extract<Role, "testo" | "comando"> }) {
  const color = disabled ? "text-cerchio-freccia" : ROLE_TEXT[tone];
  const inner = <span className={`grid size-8 place-items-center rounded-full bg-scheda ${color}`}>{children}</span>;
  const cls = "grid size-11 shrink-0 place-items-center disabled:pointer-events-none";
  if (href && !disabled) return <Link href={href} aria-label={label} className={cls}>{inner}</Link>;
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

interface SheetHeaderProps {
  title: string;
  /** Id del titolo, per `aria-labelledby` del pannello. */
  titleId?: string;
  /** «x» = X in un cerchio (lettura vocale «Chiudi»); «back» = freccia ‹ in un cerchio («Indietro»). */
  closeKind?: "x" | "back";
  onClose: () => void;
  /** L'azione principale a destra, piena (per esempio «Salva»). Disattivata = grigia. */
  action?: { label: string; onClick?: () => void; form?: string; disabled?: boolean };
  /** Contenuto a destra al posto dell'azione (per esempio le frecce delle settimane non vanno qui: stanno sotto). */
  className?: string;
}

/** Intestazione dei pannelli: X in un cerchio a sinistra, titolo al centro, azione principale a destra. Sempre visibile. */
export function SheetHeader({ title, titleId, closeKind = "x", onClose, action, className = "" }: SheetHeaderProps) {
  return (
    <div className={`grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-2 ${className}`}>
      <button type="button" onClick={onClose} aria-label={closeKind === "x" ? "Chiudi" : "Indietro"} className="grid size-11 place-items-center justify-self-start">
        <span className="grid size-10 place-items-center rounded-full bg-cerchio text-testo">{closeKind === "x" ? <IconX size={18} /> : <IconChevronLeft size={18} />}</span>
      </button>
      <h2 id={titleId} className="min-w-0 truncate text-center text-[17px] font-semibold">{title}</h2>
      {action ? (
        <button
          type={action.form ? "submit" : "button"}
          form={action.form}
          onClick={action.form ? undefined : action.onClick}
          disabled={action.disabled}
          className="min-h-11 justify-self-end rounded-full bg-comando px-4 text-[16px] font-semibold text-testo-su-comando disabled:bg-tessera disabled:text-testo-secondario"
        >
          {action.label}
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}

/** Selettore a segmenti (AI | Manuale): capsula con la voce attiva più chiara. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-full bg-tessera p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 flex-1 rounded-full px-3 text-[15px] font-semibold ${value === o.value ? "bg-segmento-attivo text-testo" : "text-testo-secondario"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const NUM_SIZE = { sm: "text-[22px]", md: "text-[28px]", lg: "text-[40px]", xl: "text-[52px]" } as const;

/**
 * Numero con unità: il componente unico per i numeri in evidenza. Carattere arrotondato di sistema, peso medio;
 * l'unità è piccola, in maiuscolo, accanto al numero («12,4 KM»). `tone` è il ruolo di colore.
 */
export function Num({ value, unit, size = "md", tone = "testo", className = "" }: { value: ReactNode; unit?: string; size?: keyof typeof NUM_SIZE; tone?: Role; className?: string }) {
  return (
    <span className={`font-cifre font-medium leading-none tabular-nums ${NUM_SIZE[size]} ${ROLE_TEXT[tone]} ${className}`}>
      {value}
      {unit && <span className="ml-1 text-[0.5em] font-semibold uppercase tracking-wide">{unit}</span>}
    </span>
  );
}

/** Nota breve sotto un elenco o un campo: piccola, nel colore secondario. */
export function Caption({ children, id, tone = "testo-secondario" }: { children: ReactNode; id?: string; tone?: Extract<Role, "testo-secondario" | "fuori" | "attenzione"> }) {
  return (
    <p id={id} className={`px-4 text-[13px] ${ROLE_TEXT[tone]}`}>
      {children}
    </p>
  );
}

const ROW_INPUT = "min-h-11 min-w-16 flex-1 bg-transparent text-right text-[17px] outline-none placeholder:text-testo-secondario";

/**
 * Riga di un campo dentro un elenco raggruppato: il nome a sinistra, il valore a destra (con l'unità accanto). Un errore sta sotto la riga.
 * `children` è il campo (`RowInput`, `RowTextarea`, `DateInput`…).
 */
export function FieldRow({ label, htmlFor, unit, error, note, children }: { label: string; htmlFor: string; unit?: string; error?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <li className="px-4 py-1.5">
      <div className="flex min-h-11 items-center gap-3">
        <span className="min-w-0 shrink py-1">
          <label htmlFor={htmlFor} className="block text-[17px] leading-snug">
            {label}
          </label>
          {note && <span className="block text-[13px] leading-tight">{note}</span>}
        </span>
        {children}
        {unit && <span className="shrink-0 text-[17px] text-testo-secondario">{unit}</span>}
      </div>
      {error && (
        <p id={`${htmlFor}-err`} role="alert" className="pb-1 text-right text-[13px] font-medium text-fuori">
          {error}
        </p>
      )}
    </li>
  );
}

interface RowInputProps {
  id: string;
  /** Valore mostrato in grigio (un numero calcolato che non è stato scritto a mano). */
  muted?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  invalid?: boolean;
  /** Campo di posta o di codice monouso: il telefono propone l'email o il codice ricevuto e non mette la maiuscola. */
  kind?: "email" | "codice";
}

/** Campo di testo a destra, in una riga (`FieldRow`). */
export function RowInput({ id, value, onChange, placeholder, inputMode = "text", invalid, muted, kind }: RowInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      autoComplete={kind === "email" ? "email" : kind === "codice" ? "one-time-code" : "off"}
      autoCapitalize={kind ? "none" : undefined}
      autoCorrect={kind === "email" ? "off" : undefined}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? `${id}-err` : undefined}
      className={`${ROW_INPUT} ${muted ? "text-testo-secondario" : ""}`}
    />
  );
}

/** Testo su più righe a destra, in una riga: una quantità lunga va a capo senza coprire il nome del campo. */
export function RowTextarea({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <textarea
      id={id}
      autoComplete="off"
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      className={`${ROW_INPUT} field-sizing-content max-h-40 resize-none py-[11px] leading-snug`}
    />
  );
}

/** Campo data (calendario di sistema dell'iPhone), a destra, in una riga. Il valore è AAAA-MM-GG. */
export function DateInput({ id, value, onChange, min, max }: { id: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return <input id={id} type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className="min-h-11 min-w-0 flex-1 appearance-none bg-transparent text-right text-[17px] text-testo-secondario outline-none" />;
}

/** Scelta tra poche voci (il pasto): il valore sta a destra con la freccia, il menu è quello di sistema. */
export function SelectInput<T extends string>({ id, value, options, onChange }: { id: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <span className="relative flex min-h-11 min-w-0 flex-1 items-center justify-end gap-1.5 text-testo-secondario">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="absolute inset-0 w-full cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="text-[17px]">{options.find((o) => o.value === value)?.label}</span>
      <IconChevronRight size={16} strokeWidth={2.4} />
    </span>
  );
}

/** Interruttore: acceso nel colore Comando. */
export function Switch({ checked, onChange, disabled, labelledBy, describedBy }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; labelledBy: string; describedBy?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-11 w-[58px] shrink-0 disabled:opacity-40"
    >
      <span className={`absolute inset-x-0 top-[7px] h-[30px] rounded-full transition-colors ${checked ? "bg-comando" : "bg-cerchio-freccia"}`}>
        <span className={`absolute top-[3px] size-6 rounded-full bg-testo transition-all ${checked ? "left-[31px]" : "left-[3px]"}`} />
      </span>
    </button>
  );
}
