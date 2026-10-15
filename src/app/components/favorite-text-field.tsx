"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { PickedFavorite, Segment } from "../lib/favorite-text";

export interface FavoriteTextFieldHandle {
  /** Mette l'etichetta del preferito al punto del cursore (o in fondo, se il cursore non c'è) e porta il cursore dopo di essa. */
  insertFavorite: (picked: PickedFavorite) => void;
  focus: () => void;
}

interface Props {
  id: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (segments: Segment[]) => void;
  handleRef: RefObject<FavoriteTextFieldHandle | null>;
}

const CHIP_CLASS = "mx-0.5 inline-block max-w-full select-none truncate rounded-full bg-cerchio px-2.5 py-0.5 align-baseline text-[15px] font-medium text-testo";
/** L'etichetta di un pasto preferito ha in più un bordo nel colore Comando, per distinguerla da quella di un piatto (BRIEF §4.1). */
const MEAL_CHIP_CLASS = `${CHIP_CLASS} border border-comando`;

/** Spazio dopo un'etichetta: lascia un punto dove mettere il cursore. Nel testo letto vale uno spazio normale. */
const NBSP = "\u00a0";

function makeChip({ kind, favorite }: PickedFavorite): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.favoriteId = favorite.id;
  if (kind === "meal") chip.dataset.favoriteKind = "meal";
  chip.className = kind === "meal" ? MEAL_CHIP_CLASS : CHIP_CLASS;
  chip.textContent = favorite.name;
  return chip;
}

/** Legge il contenuto del campo: pezzi di testo e etichette, nell'ordine in cui sono scritti. */
export function readSegments(root: HTMLElement): Segment[] {
  const out: Segment[] = [];
  const pushText = (text: string) => {
    const last = out[out.length - 1];
    if (last?.kind === "text") last.text += text;
    else out.push({ kind: "text", text });
  };
  const walk = (node: Node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) pushText((n.nodeValue ?? "").split(NBSP).join(" "));
      else if (n instanceof HTMLElement) {
        if (n.dataset.favoriteId) out.push({ kind: "favorite", favoriteId: n.dataset.favoriteId, ...(n.dataset.favoriteKind === "meal" ? { favoriteKind: "meal" as const } : {}) });
        else if (n.tagName === "BR") pushText("\n");
        else {
          // Un a capo scritto con Invio: il browser racchiude la riga in un blocco.
          if ((n.tagName === "DIV" || n.tagName === "P") && out.length > 0) pushText("\n");
          walk(n);
        }
      }
    });
  };
  walk(root);
  return out;
}

/**
 * Il campo «Cosa hai mangiato?» (BRIEF §4.1): testo libero, scritto o dettato, in cui si possono mettere preferiti come etichette (tessere piccole con
 * il nome). Un solo tasto «indietro» cancella un'etichetta intera. Il contenuto è gestito dal browser (campo modificabile); chi lo usa riceve i pezzi
 * a ogni modifica.
 */
export function FavoriteTextField({ id, placeholder, disabled = false, onChange, handleRef }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);

  // Il punto del cursore si ricorda anche quando il campo perde il fuoco (si apre l'elenco dei preferiti).
  useEffect(() => {
    const onSelection = () => {
      const sel = document.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) saved.current = sel.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const segments = readSegments(el);
    // Campo svuotato: il browser lascia un <br> e il segnaposto non comparirebbe.
    if (segments.every((s) => s.kind === "text" && s.text.trim() === "") && el.childNodes.length > 0 && !el.querySelector("[data-favorite-id]")) el.innerHTML = "";
    onChange(segments);
  };

  useEffect(() => {
    handleRef.current = {
      focus: () => ref.current?.focus(),
      insertFavorite: (picked) => {
        const el = ref.current;
        if (!el) return;
        let range = saved.current;
        if (!range || !el.contains(range.startContainer)) {
          range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
        }
        range.deleteContents();
        const chip = makeChip(picked);
        range.insertNode(chip);
        const space = document.createTextNode(NBSP);
        chip.after(space);
        // Il cursore sta subito dopo l'etichetta (prima dello spazio): un solo tasto «indietro» la cancella tutta, e quanto si scrive viene dopo di lei.
        const after = document.createRange();
        after.setStart(space, 0);
        after.collapse(true);
        saved.current = after;
        el.focus();
        const sel = document.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(after);
        emit();
      },
    };
  });

  return (
    <div
      ref={ref}
      id={id}
      role="textbox"
      aria-multiline="true"
      aria-label="Cosa hai mangiato?"
      data-placeholder={placeholder}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck
      onInput={emit}
      onPaste={(e) => {
        // Solo testo semplice: niente formattazione incollata dentro il campo.
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
      className="min-h-[5.5rem] w-full whitespace-pre-wrap break-words text-[17px] leading-relaxed outline-none empty:before:text-testo-secondario empty:before:content-[attr(data-placeholder)]"
    />
  );
}
