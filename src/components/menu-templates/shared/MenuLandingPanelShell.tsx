"use client";

import type { ReactNode } from "react";

import { LuxuryBackButton } from "../luxury/LuxuryBackButton";

type MenuLandingPanelShellProps = {
  title?: string;
  onBack: () => void;
  children: ReactNode;
  className?: string;
  backClassName?: string;
};

export function MenuLandingPanelShell({
  title,
  onBack,
  children,
  className,
  backClassName,
}: MenuLandingPanelShellProps) {
  return (
    <div className={className ?? "min-h-[60vh]"}>
      <div className="flex items-center gap-2 px-4 py-3">
        <LuxuryBackButton onClick={onBack} className={backClassName} />
        {title ? <p className="text-sm font-medium">{title}</p> : null}
      </div>
      {children}
    </div>
  );
}
