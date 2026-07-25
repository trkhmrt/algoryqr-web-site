import type { ReactNode } from "react";

import { LUMEN_STYLES } from "./styles";

type LumenShellProps = {
  children: ReactNode;
};

export function LumenShell({ children }: LumenShellProps) {
  return (
    <div className="lumen-menu relative min-h-screen overflow-x-hidden">
      <style>{LUMEN_STYLES}</style>
      {children}
    </div>
  );
}
