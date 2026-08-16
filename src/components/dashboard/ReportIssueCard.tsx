"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";

import { ReportIssueDialog } from "@/components/dashboard/ReportIssueDialog";
import { cn } from "@/lib/utils";

type ReportIssueCardProps = {
  className?: string;
};

export function ReportIssueCard({ className }: ReportIssueCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sorun bildir"
        className={cn(
          "tile-surface group relative overflow-hidden rounded-2xl border border-border/70 p-5 text-left",
          className,
        )}
      >
        <LifeBuoy
          aria-hidden
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-8 -right-6 h-36 w-36 text-foreground/[0.045] transition-transform duration-500 group-hover:scale-105"
        />

        <span className="relative flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface-muted text-muted-foreground">
            <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium tracking-tight text-foreground">
              Sorun Bildir
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Geri bildirim veya öneri gönderin
            </span>
          </span>
        </span>
      </button>

      <ReportIssueDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
