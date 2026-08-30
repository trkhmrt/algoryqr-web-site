"use client";

import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

import { DigitalMenuHubTabs } from "./DigitalMenuHubTabs";

type DigitalMenuHubShellProps = {
  title: string;
  hint?: string | null;
  action?: ReactNode;
  children: ReactNode;
};

export function DigitalMenuHubShell({ title, hint, action, children }: DigitalMenuHubShellProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <DigitalMenuHubTabs />
        <DashboardPageHeader title={title} hint={hint} action={action} />
      </div>
      {children}
    </div>
  );
}
