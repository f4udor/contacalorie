"use client";

import { useSyncExternalStore } from "react";
import type { DateKey } from "@/engine";
import { todayKey } from "./today";

const subscribeNever = () => () => {};

/** Data di oggi sul dispositivo; null durante il rendering sul server. */
export function useToday(): DateKey | null {
  return useSyncExternalStore(subscribeNever, () => todayKey(), () => null);
}
