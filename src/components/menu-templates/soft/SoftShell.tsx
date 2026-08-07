import type { ReactNode } from "react";

import { MenuViewportFrame } from "../shared";
import { SOFT_STYLES } from "./styles";

type SoftShellProps = {
  children: ReactNode;
};

export function SoftShell({ children }: SoftShellProps) {
  return (
    <MenuViewportFrame frameBgClassName="soft-menu" innerClassName="soft-menu bg-[var(--sf-bg)]">
      <style>{SOFT_STYLES}</style>
      {children}
    </MenuViewportFrame>
  );
}
