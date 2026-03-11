"use client";

import { useEffect } from "react";
import { useDailyLogStore } from "@/lib/store";

export function StoreBootstrap() {
  const hasBootstrapped = useDailyLogStore((state) => state.hasBootstrapped);
  const loadEntry = useDailyLogStore((state) => state.loadEntry);

  useEffect(() => {
    if (!hasBootstrapped) {
      void loadEntry();
    }
  }, [hasBootstrapped, loadEntry]);

  return null;
}