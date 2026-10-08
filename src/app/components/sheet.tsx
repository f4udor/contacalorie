"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { shouldCloseOnDrag } from "./sheet-logic";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Elemento accanto al titolo (es. il selettore AI | Manuale). */
  headerExtra?: ReactNode;
  children: ReactNode;
}

/** Pannello che sale dal basso. Si chiude con il tasto Chiudi, Esc, un tocco fuori o trascinando verso il basso. */
export function Sheet({ open, onClose, title, headerExtra, children }: SheetProps) {
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
          <div className="flex min-h-11 items-center justify-between pt-1">
            <h2 id={titleId} className="text-xl font-bold">
              {title}
            </h2>
            {headerExtra && (
              <div className="ml-3 mr-auto" onPointerDown={(e) => e.stopPropagation()}>
                {headerExtra}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="-mr-2 min-h-11 min-w-11 rounded-full px-3 text-base font-semibold text-accent"
            >
              Chiudi
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}
