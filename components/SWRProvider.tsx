// components/SWRProvider.tsx
"use client";

import { SWRConfig } from "swr";
import { defaultSWRConfig } from "@/lib/swrConfig";

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: Readonly<SWRProviderProps>) {
  return <SWRConfig value={defaultSWRConfig}>{children}</SWRConfig>;
}
