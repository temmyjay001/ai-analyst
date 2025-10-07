"use client";

import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
