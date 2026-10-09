"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { shouldCloseOnDrag } from "./sheet-logic";
import { SheetHeader } from "./ui/ui";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * Azione principale a destra dell'intestazione (per esempio «Salva», piena), sempre visibile mentre il contenuto scorre.
   * Senza `onSave` né `formId` non c'è. Con `formId` il tasto invia quel modulo.
   */
  bar?: { onSave?: () => void; formId?: string; saveDisabled?: boolean; saveLabel?: string };
  /** Se c'è, a sinistra non c'è la X ma la freccia ‹ (pagina interna di un pannello), e tocca questa funzione. */
  back?: () => void;
  /** Riga fissa sotto l'intestazione (es. il selettore AI | Manuale), che non scorre con il contenuto. */
  subHeader?: ReactNode;
  children: ReactNode;
}

/** Pannello che sale dal basso. Si chiude con la X, Esc, un tocco fuori o trascinando verso il basso. */
export function Sheet({ open, onClose, title, bar, back, subHeader, children }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startT: number } | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: e.clientY, startT: e.timeStamp };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset(Math.max(0, e.clientY - drag.current.startY));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const distance = e.clientY - drag.current.startY;
    const duration = e.timeStamp - drag.current.startT;
    drag.current = null;
    setOffset(0);
    if (shouldCloseOnDrag(distance, duration)) onClose();
  };

  const action = bar && (bar.onSave || bar.formId) ? { label: bar.saveLabel ?? "Salva", onClick: bar.onSave, form: bar.formId, disabled: bar.saveDisabled } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="scrim-anim absolute inset-0 bg-velo [animation:scrim-in_200ms_ease-out]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet-anim relative flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-scheda bg-pannello outline-none [animation:sheet-up_260ms_cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: offset ? `translateY(${offset}px)` : undefined, transition: offset ? "none" : undefined }}
      >
        <div
          className="touch-none select-none px-3 pt-2"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-separatore" aria-hidden="true" />
          <div className="pt-1" onPointerDown={(e) => e.stopPropagation()}>
            <SheetHeader title={title} titleId={titleId} closeKind={back ? "back" : "x"} onClose={back ?? onClose} action={action} />
          </div>
        </div>
        {subHeader && <div className="px-4 pb-1 pt-1">{subHeader}</div>}
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}
