"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";

import { DigitalMenuPaywall } from "./DigitalMenuPaywall";

export function DigitalMenuHubGate({ children }: { children: ReactNode }) {
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <DigitalMenuPaywall />;
  }

  return children;
}
