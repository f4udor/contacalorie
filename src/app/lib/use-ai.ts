"use client";

import { useEffect, useState } from "react";
import { fetchAiAvailable } from "./ai-client";

/** Dice se la stima automatica è attiva: null finché non si sa, poi vero o falso. */
export function useAiAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetchAiAvailable().then((a) => alive && setAvailable(a));
    return () => {
      alive = false;
    };
  }, []);
  return available;
}
