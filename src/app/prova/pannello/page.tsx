"use client";

import { useState } from "react";
import { Card } from "../../components/card";
import { PageTitle } from "../../components/page-title";
import { Sheet } from "../../components/sheet";

/** Pagina di prova del pannello dal basso. Verrà tolta quando il pannello Aggiungi (T2.3) lo userà davvero. */
export default function ProvaPannelloPage() {
  const [open, setOpen] = useState(false);
  return (
    <main>
      <PageTitle>Prova pannello</PageTitle>
      <Card>
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-xl bg-accent px-4 font-semibold text-white">
          Apri pannello
        </button>
      </Card>
      <Sheet open={open} onClose={() => setOpen(false)} title="Pannello di prova">
        <p className="text-muted">Trascina verso il basso, tocca fuori, premi Esc o Chiudi per chiuderlo.</p>
      </Sheet>
    </main>
  );
}
