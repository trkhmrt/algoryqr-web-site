import type { ReactNode } from "react";

import { MenuViewportFrame } from "../shared";
import { ALBA_STYLES } from "./styles";

type AlbaShellProps = {
  children: ReactNode;
};

export function AlbaShell({ children }: AlbaShellProps) {
  return (
    <MenuViewportFrame frameBgClassName="alba-menu" innerClassName="alba-menu">
      <style>{ALBA_STYLES}</style>
      {children}
    </MenuViewportFrame>
  );
}
