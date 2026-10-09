import type { AiProvider } from "./types";

/**
 * Il nome del modello in forma leggibile: «gemini-2.5-flash» → «Gemini 2.5 Flash». Le parole prendono la maiuscola iniziale,
 * i numeri restano come sono. Senza identificativo non c'è nome (null).
 */
export function readableModelName(id: string | null | undefined): string | null {
  const clean = (id ?? "").trim();
  if (clean === "") return null;
  return clean
    .split(/[-_\s]+/)
    .filter((w) => w !== "")
    .map((w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Il nome da mostrare per il provider in uso: «Modello di prova» per il provider finto, altrimenti il nome leggibile del modello; null se l'AI non è configurata. */
export function providerModelLabel(provider: Pick<AiProvider, "name" | "model"> | null): string | null {
  if (!provider) return null;
  if (provider.name === "finto") return "Modello di prova";
  return readableModelName(provider.model);
}
