"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { SWIPE_ACTION_WIDTH, SWIPE_ICON_ACTION_WIDTH, nextOpenRow, shouldStayOpen, swipeDirection, swipeOffset } from "./swipe-logic";

export interface SwipeAction {
  key: string;
  label: string;
  /** Solo icona (cestino): più stretto. */
  icon?: ReactNode;
  /** Testo mostrato nel pulsante quando `label` è solo per la lettura vocale (es. «Elimina»). */
  visibleLabel?: string;
  tone: "accent" | "danger";
  /** Larghezza del pulsante in px, se l'etichetta è più lunga del solito. */
  width?: number;
  onClick: () => void;
}

/** Quale riga è aperta: al massimo una per gruppo. */
export function useOpenRow(): { openId: string | null; setOpen: (id: string, open: boolean) => void; closeAll: () => void } {
  const [openId, setOpenId] = useState<string | null>(null);
  return { openId, setOpen: (id, open) => setOpenId((cur) => nextOpenRow(cur, id, open)), closeAll: () => setOpenId(null) };
}

interface SwipeRowProps {
  id: string;
  openId: string | null;
  setOpen: (id: string, open: boolean) => void;
  actions: SwipeAction[];
  children: ReactNode;
  className?: string;
  /** Fondo della riga che scorre (di solito una tessera). */
  surfaceClassName?: string;
}

/**
 * Riga che scorre verso sinistra e mostra i pulsanti a destra. Scorrendo indietro o toccando altrove si richiude.
 * Verso destra non fa nulla. Il gesto parte solo se il movimento è più orizzontale che verticale, così la pagina scorre normalmente.
 */
export function SwipeRow({ id, openId, setOpen, actions, children, className = "", surfaceClassName = "bg-tessera" }: SwipeRowProps) {
  const actionWidth = (a: SwipeAction) => a.width ?? (a.icon ? SWIPE_ICON_ACTION_WIDTH : SWIPE_ACTION_WIDTH);
  const width = actions.reduce((sum, a) => sum + actionWidth(a), 0);
  const isOpen = openId === id;
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const gesture = useRef<{ x: number; y: number; startOffset: number; locked: boolean; wasOpen: boolean } | null>(null);
  const swallowClick = useRef(false);

  // Un tocco fuori dalla riga aperta la richiude.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(id, false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [isOpen, id, setOpen]);

  const resting = isOpen ? -width : 0;
  const shown = dragOffset ?? resting;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    gesture.current = { x: e.clientX, y: e.clientY, startOffset: resting, locked: false, wasOpen: isOpen };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    if (!g.locked) {
      const dir = swipeDirection(dx, e.clientY - g.y);
      if (dir === "pending") return;
      if (dir === "vertical") {
        gesture.current = null;
        return;
      }
      g.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDragOffset(swipeOffset(g.startOffset, dx, width));
  };
  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.locked) {
      const offset = swipeOffset(g.startOffset, e.clientX - g.x, width);
      setDragOffset(null);
      setOpen(id, !cancelled && shouldStayOpen(offset, width));
      swallowClick.current = true;
      setTimeout(() => (swallowClick.current = false), 0);
    } else if (g.wasOpen && !cancelled) {
      // Un tocco sulla riga aperta la richiude, senza fare quello che farebbe il tocco.
      setOpen(id, false);
      swallowClick.current = true;
      setTimeout(() => (swallowClick.current = false), 0);
    }
  };

  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`} data-swipe-row={id} data-open={isOpen ? "true" : "false"}>
      <div className="absolute inset-y-0 right-0 flex" style={{ width, visibility: shown === 0 ? "hidden" : "visible" }}>
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            aria-label={a.icon || a.visibleLabel ? a.label : undefined}
            onClick={() => {
              setOpen(id, false);
              a.onClick();
            }}
            className={`flex min-h-11 items-center justify-center px-1 text-center text-[15px] font-semibold leading-tight ${a.tone === "danger" ? "bg-fuori text-testo" : "bg-comando text-testo-su-comando"}`}
            style={{ width: actionWidth(a) }}
          >
            {a.icon ?? a.visibleLabel ?? a.label}
          </button>
        ))}
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
        onClickCapture={(e) => {
          if (swallowClick.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        className={`relative ${surfaceClassName}`}
        style={{ transform: `translateX(${shown}px)`, touchAction: "pan-y", transition: dragOffset === null ? "transform 200ms ease-out" : "none" }}
      >
        {children}
      </div>
    </div>
  );
}

/** Icona del cestino. */
export const trashIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />
  </svg>
);
