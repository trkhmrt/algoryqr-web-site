"use client";

import type { ReactNode } from "react";

type DigitalMenuHubShellProps = {
  action?: ReactNode;
  children: ReactNode;
};

export function DigitalMenuHubShell({ action, children }: DigitalMenuHubShellProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {action ? <div className="flex justify-end">{action}</div> : null}
      {children}
    </div>
  );
}
