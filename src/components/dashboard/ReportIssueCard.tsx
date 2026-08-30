"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";

import { ReportIssueDialog } from "@/components/dashboard/ReportIssueDialog";

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
        className={className ? `${className} items-start` : undefined}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          <LifeBuoy className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-sm font-medium tracking-tight text-foreground">
            Sorun Bildir
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Geri bildirim veya öneri gönderin
          </span>
        </span>
      </button>

      <ReportIssueDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
