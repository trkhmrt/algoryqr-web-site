import type { ReactNode } from "react";

import { SOFT_STYLES } from "./styles";

type SoftShellProps = {
  children: ReactNode;
};

export function SoftShell({ children }: SoftShellProps) {
  return (
    <div className="soft-menu relative min-h-screen overflow-x-hidden">
      <style>{SOFT_STYLES}</style>
      {children}
    </div>
  );
}
