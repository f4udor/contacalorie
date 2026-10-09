import type { ReactNode } from "react";

/** Titolo grande di schermata, con eventuale riga di contesto sopra o azioni a destra. */
export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex min-h-11 items-end justify-between gap-3 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight">{children}</h1>
      {aside}
    </header>
  );
}
