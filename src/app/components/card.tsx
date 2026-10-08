import type { ReactNode } from "react";

/** Scheda arrotondata su sfondo neutro. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-card p-4 ${className}`}>{children}</section>;
}
