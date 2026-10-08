import { Suspense } from "react";
import { SettimanaScreen } from "../settimana-screen";

export default function SettimanaPage() {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
      <SettimanaScreen />
    </Suspense>
  );
}
