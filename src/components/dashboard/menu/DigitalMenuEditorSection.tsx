"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type DigitalMenuEditorSectionProps = {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export default function DigitalMenuEditorSection({
  title,
  description,
  open,
  onOpenChange,
  children,
}: DigitalMenuEditorSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="border-t border-border px-4 py-4 sm:px-5">{children}</div> : null}
    </div>
  );
}
