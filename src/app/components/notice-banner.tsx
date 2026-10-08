"use client";

import { useDataNotice } from "../data-provider";

/** Avviso in cima alla pagina quando i dati salvati erano illeggibili o non si riesce a salvare. */
export function NoticeBanner() {
  const { notice, dismissNotice } = useDataNotice();
  if (!notice) return null;
  return (
    <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-2xl bg-warn-fill px-4 py-3 text-sm font-medium text-black">
      <span>{notice}</span>
      <button type="button" className="-my-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 font-semibold" onClick={dismissNotice}>
        Ok
      </button>
    </div>
  );
}
