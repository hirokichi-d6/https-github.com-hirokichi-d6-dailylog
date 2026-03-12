"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDailyLogStore } from "@/lib/store";

export function StoreBootstrap() {
  const pathname = usePathname();
  const hasBootstrapped = useDailyLogStore((state) => state.hasBootstrapped);
  const loadEntry = useDailyLogStore((state) => state.loadEntry);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    if (!hasBootstrapped) {
      void loadEntry();
    }
  }, [pathname, hasBootstrapped, loadEntry]);

  return null;
}