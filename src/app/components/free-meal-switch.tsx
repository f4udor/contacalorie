import { formatNumber } from "../lib/format";
import { Caption, GroupedList, Switch } from "./ui/ui";

/** La riga dell'interruttore «Pasto libero» (da mettere in un elenco raggruppato). Se `blockedText` c'è, è disattivata. */
export function FreeMealRow({ idPrefix = "free", checked, blockedText, onChange }: { idPrefix?: string; checked: boolean; blockedText: string | null; onChange: (value: boolean) => void }) {
  return (
    <li className="flex min-h-12 items-center justify-between gap-3 px-4">
      <span id={`${idPrefix}-label`} className="text-[17px]">
        Pasto libero
      </span>
      <Switch checked={checked} onChange={onChange} disabled={blockedText !== null} labelledBy={`${idPrefix}-label`} describedBy={`${idPrefix}-help`} />
    </li>
  );
}

/** La nota sotto l'interruttore: perché è bloccato, oppure quanto conta il pasto libero. */
export function FreeMealNote({ idPrefix = "free", blockedText, freeMealCap, error }: { idPrefix?: string; blockedText: string | null; freeMealCap: number; error?: string }) {
  return (
    <>
      <Caption id={`${idPrefix}-help`}>{blockedText ?? `Tutto il pasto conta al massimo ${formatNumber(freeMealCap)} kcal. Uno a settimana.`}</Caption>
      {error && <Caption tone="fuori">{error}</Caption>}
    </>
  );
}

/** Interruttore «Pasto libero» da solo (inserimento a mano), con la sua nota. */
export function FreeMealSwitch({ idPrefix = "free", checked, blockedText, freeMealCap, error, onChange }: { idPrefix?: string; checked: boolean; blockedText: string | null; freeMealCap: number; error?: string; onChange: (value: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <GroupedList>
        <FreeMealRow idPrefix={idPrefix} checked={checked} blockedText={blockedText} onChange={onChange} />
      </GroupedList>
      <FreeMealNote idPrefix={idPrefix} blockedText={blockedText} freeMealCap={freeMealCap} error={error} />
    </div>
  );
}
