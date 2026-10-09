"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab } from "../lib/nav";
import { IconBars, IconLine, IconRing } from "./ui/icons";

const TABS = [
  { id: "oggi", href: "/", label: "Oggi", icon: <IconRing size={24} /> },
  { id: "settimana", href: "/settimana", label: "Settimana", icon: <IconBars size={24} /> },
  { id: "grafici", href: "/grafici", label: "Grafici", icon: <IconLine size={24} /> },
] as const;

/**
 * Barra in basso (BRIEF §10.4): capsula sospesa in vetro con tre voci, icona e nome. La voce attiva sta in una pillola più scura
 * nel colore Comando. Le Impostazioni non sono qui: si aprono dall'ingranaggio delle intestazioni.
 */
export function BottomNav() {
  const current = activeTab(usePathname());
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-xl rounded-full border border-vetro-bordo bg-vetro p-1 shadow-[inset_0_1px_0_var(--vetro-luce)] backdrop-blur-xl"
    >
      <ul className="flex">
        {TABS.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-semibold whitespace-nowrap ${active ? "bg-voce-attiva-barra text-comando" : "text-testo"}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
