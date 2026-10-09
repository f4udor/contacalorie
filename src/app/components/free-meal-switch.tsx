import { formatNumber } from "../lib/format";

/** Interruttore "Pasto libero", lo stesso per l'inserimento a mano e per la proposta dell'AI. Se `blockedText` c'è, è disattivato e lo spiega. */
export function FreeMealSwitch({
  idPrefix = "free",
  checked,
  blockedText,
  slotName,
  freeMealCap,
  error,
  onChange,
}: {
  idPrefix?: string;
  checked: boolean;
  /** Perché non si può accendere (settimana già con un pasto libero, o un altro pasto della proposta lo è). */
  blockedText: string | null;
  /** Nome della fascia in minuscolo. */
  slotName: string;
  freeMealCap: number;
  error?: string;
  onChange: (value: boolean) => void;
}) {
  const disabled = blockedText !== null;
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <span id={`${idPrefix}-label`} className="text-[17px] font-semibold">Pasto libero</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${idPrefix}-label`}
          aria-describedby={`${idPrefix}-help`}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className="relative h-11 w-16 shrink-0 disabled:opacity-40"
        >
          <span className={`absolute inset-x-1 top-1.5 h-8 rounded-full transition-colors ${checked ? "bg-accent" : "bg-track"}`}>
            <span className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-all ${checked ? "left-[1.625rem]" : "left-0.5"}`} />
          </span>
        </button>
      </div>
      <p id={`${idPrefix}-help`} className="pb-1 text-sm text-muted">
        {blockedText ?? `Vale per l'intero pasto (${slotName}): in totale conta al massimo ${formatNumber(freeMealCap)} kcal nel budget del giorno. Uno a settimana.`}
      </p>
      {error && <p className="pb-1 text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
