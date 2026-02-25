"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AppSettingsProvider } from "@/components/app-settings-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppSettingsProvider>{children}</AppSettingsProvider>
    </SessionProvider>
  );
}
