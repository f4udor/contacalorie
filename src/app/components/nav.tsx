"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = (children: ReactNode) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TABS = [
  { href: "/", label: "Oggi", icon: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>) },
  { href: "/settimana", label: "Settimana", icon: icon(<><path d="M5 20V11M10 20V6M15 20v-6M20 20V9" /></>) },
  { href: "/grafici", label: "Grafici", icon: icon(<><path d="M3.5 19.5h17M4.5 15l4.5-5 4 3.5 6-7" /></>) },
  { href: "/impostazioni", label: "Impostazioni", icon: icon(<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>) },
] as const;

/** Barra di navigazione in basso, con rispetto della barra home dell'iPhone. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-vetro pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}
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
