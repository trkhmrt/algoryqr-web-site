"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";

import { ReportIssueDialog } from "@/components/dashboard/ReportIssueDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReportIssueFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-12 gap-2 rounded-full px-4 shadow-lg",
          "lg:bottom-8 lg:right-8",
        )}
        aria-label="Sorun bildir"
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden sm:inline">Sorun Bildir</span>
      </Button>

      <ReportIssueDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
