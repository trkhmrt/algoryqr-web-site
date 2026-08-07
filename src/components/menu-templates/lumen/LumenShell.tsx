import type { ReactNode } from "react";

import { MenuViewportFrame } from "../shared";
import { LUMEN_STYLES } from "./styles";

type LumenShellProps = {
  children: ReactNode;
};

export function LumenShell({ children }: LumenShellProps) {
  return (
    <MenuViewportFrame frameBgClassName="lumen-menu" innerClassName="lumen-menu ln-bg">
      <style>{LUMEN_STYLES}</style>
      {children}
    </MenuViewportFrame>
  );
}
