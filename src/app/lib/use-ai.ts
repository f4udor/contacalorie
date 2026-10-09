"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../auth-provider";
import { fetchAiAvailable, fetchAiInfo } from "./ai-client";
import type { AiInfo } from "./ai-client";

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

/** Stato completo della stima automatica per Collegamenti: null finché non si sa (o se la lettura non riesce). */
export function useAiInfo(): AiInfo | null {
  const { getAccessToken } = useAuth();
  const [info, setInfo] = useState<AiInfo | null>(null);
  useEffect(() => {
    let alive = true;
    fetchAiInfo(getAccessToken).then((i) => alive && setInfo(i));
    return () => {
      alive = false;
    };
  }, [getAccessToken]);
  return info;
}
