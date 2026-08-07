import type { CSSProperties, ReactNode } from "react";

import { MenuViewportFrame } from "../shared";

type DarkShellProps = {
  children: ReactNode;
};

const darkFrameStyle: CSSProperties = {
  ["--menu-frame-bg" as string]: "#171717",
  ["--menu-frame-border" as string]: "rgba(255,255,255,0.08)",
};

export function DarkShell({ children }: DarkShellProps) {
  return (
    <MenuViewportFrame
      frameBgClassName="bg-neutral-900"
      innerClassName="bg-neutral-950 text-neutral-100"
      style={darkFrameStyle}
    >
      {children}
    </MenuViewportFrame>
  );
}
