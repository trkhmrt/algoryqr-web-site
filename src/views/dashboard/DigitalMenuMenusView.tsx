"use client";

import { DigitalMenuHubGate } from "@/components/dashboard/digital-menu/DigitalMenuHubGate";
import { DigitalMenuMenusPanel } from "@/components/dashboard/digital-menu/DigitalMenuMenusPanel";

export default function DigitalMenuMenusView() {
  return (
    <DigitalMenuHubGate>
      <DigitalMenuMenusPanel />
    </DigitalMenuHubGate>
  );
}
