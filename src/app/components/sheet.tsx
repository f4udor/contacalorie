"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { shouldCloseOnDrag } from "./sheet-logic";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * Intestazione a barra: "Chiudi" a sinistra, titolo al centro, "Salva" a destra, sempre visibile mentre il contenuto scorre.
   * Senza `onSave` né `formId` la barra non ha il pulsante di destra. Con `formId` "Salva" invia quel modulo.
   */
  bar?: { onSave?: () => void; formId?: string; saveDisabled?: boolean; saveLabel?: string };
  /** Riga fissa sotto l'intestazione (es. il selettore AI | Manuale), che non scorre con il contenuto. */
  subHeader?: ReactNode;
  children: ReactNode;
}

/** Pannello che sale dal basso. Si chiude con il tasto Chiudi, Esc, un tocco fuori o trascinando verso il basso. */
export function Sheet({ open, onClose, title, bar, subHeader, children }: SheetProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="scrim-anim absolute inset-0 bg-[var(--scrim)] [animation:scrim-in_200ms_ease-out]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet-anim relative flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-3xl bg-card shadow-2xl outline-none [animation:sheet-up_260ms_cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: offset ? `translateY(${offset}px)` : undefined, transition: offset ? "none" : undefined }}
      >
        <div
          className="touch-none select-none px-4 pt-2"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-track" aria-hidden="true" />
          {bar ? (
            <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={onClose} className="-ml-2 min-h-11 min-w-11 justify-self-start rounded-full px-3 text-base font-semibold text-accent">
                Chiudi
              </button>
              <h2 id={titleId} className="min-w-0 truncate text-center text-[17px] font-bold">
                {title}
              </h2>
              {bar.onSave || bar.formId ? (
                <button
                  type={bar.formId ? "submit" : "button"}
                  form={bar.formId}
                  onClick={bar.formId ? undefined : bar.onSave}
                  disabled={bar.saveDisabled}
                  className="-mr-2 min-h-11 min-w-11 justify-self-end rounded-full px-3 text-base font-bold text-accent disabled:opacity-40"
                >
                  {bar.saveLabel ?? "Salva"}
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          ) : (
            <div className="flex min-h-11 items-center justify-between pt-1">
              <h2 id={titleId} className="text-xl font-bold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="-mr-2 min-h-11 min-w-11 rounded-full px-3 text-base font-semibold text-accent"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
        {subHeader && <div className="px-4 pb-1 pt-1">{subHeader}</div>}
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}
