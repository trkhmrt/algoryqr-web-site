"use client";

import type { ReactNode } from "react";

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}
