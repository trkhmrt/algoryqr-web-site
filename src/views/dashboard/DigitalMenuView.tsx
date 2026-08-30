"use client";

import { DigitalMenuBranchesPanel } from "@/components/dashboard/digital-menu/DigitalMenuBranchesPanel";
import { DigitalMenuHubGate } from "@/components/dashboard/digital-menu/DigitalMenuHubGate";

export default function DigitalMenuView() {
  return (
    <DigitalMenuHubGate>
      <DigitalMenuBranchesPanel />
    </DigitalMenuHubGate>
  );
}
