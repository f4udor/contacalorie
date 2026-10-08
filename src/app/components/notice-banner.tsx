"use client";

import { useDataProblem } from "../data-provider";

/** Avviso in cima alla pagina: dati illeggibili, oppure lettura o salvataggio non riusciti (con "Riprova" per le letture). */
export function NoticeBanner() {
  const { problem, dismissProblem } = useDataProblem();
  if (!problem) return null;
  const btn = "-my-2 min-h-11 min-w-11 rounded-full px-3 font-semibold";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[60] mx-auto max-w-xl px-4">
      <div role="alert" className="pointer-events-auto flex items-start justify-between gap-3 rounded-2xl bg-warn-fill px-4 py-3 text-sm font-medium text-black shadow-lg">
      <span>{problem.text}</span>
      <span className="-mr-2 flex shrink-0 items-center">
        {problem.kind === "lettura" && (
          <button type="button" className={btn} onClick={() => window.location.reload()}>
            Riprova
          </button>
        )}
        <button type="button" className={btn} onClick={dismissProblem}>
          Ok
        </button>
      </span>
      </div>
    </div>
  );
}
