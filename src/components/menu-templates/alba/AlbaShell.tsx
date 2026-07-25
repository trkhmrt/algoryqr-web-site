import type { ReactNode } from "react";

import { ALBA_STYLES } from "./styles";

type AlbaShellProps = {
  children: ReactNode;
};

export function AlbaShell({ children }: AlbaShellProps) {
  return (
    <div className="alba-menu relative min-h-screen overflow-x-hidden">
      <style>{ALBA_STYLES}</style>
      {children}
    </div>
  );
}
