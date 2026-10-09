import { Suspense } from "react";
import { ImpostazioniScreen } from "../impostazioni-screen";

export default function ImpostazioniPage() {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
      <ImpostazioniScreen />
    </Suspense>
  );
}
