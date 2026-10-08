import { Suspense } from "react";
import { OggiScreen } from "./oggi-screen";

export default function OggiPage() {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
      <OggiScreen />
    </Suspense>
  );
}
