"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type MenuViewportFrameProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  frameBgClassName?: string;
  style?: React.CSSProperties;
};

export function MenuViewportFrame({
  children,
  className,
  innerClassName,
  frameBgClassName,
  style,
}: MenuViewportFrameProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-[var(--menu-frame-bg,#f4f4f5)]",
        frameBgClassName,
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "menu-viewport-frame relative mx-auto w-full max-w-md min-h-screen overflow-x-hidden shadow-[0_0_0_1px_var(--menu-frame-border,rgba(0,0,0,0.08))] lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-[1.75rem] lg:overflow-hidden lg:shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_1px_var(--menu-frame-border,rgba(0,0,0,0.06))]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
