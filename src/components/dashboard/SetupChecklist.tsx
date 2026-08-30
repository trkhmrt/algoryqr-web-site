"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { nextSetupStep, type SetupStep } from "@/lib/dashboard-setup";
import { cn } from "@/lib/utils";

type SetupChecklistProps = {
  steps: SetupStep[];
};

export function SetupChecklist({ steps }: SetupChecklistProps) {
  const next = nextSetupStep(steps);

  return (
    <section
      className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-border dark:bg-card sm:p-5"
      aria-label="Kurulum"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">İlk kurulum</h2>
          <p className="text-xs text-muted-foreground">Şube, menü ve yayın. Sırayla bitirin.</p>
        </div>
        {next ? (
          <Button asChild size="sm">
            <Link href={next.href}>{next.label}</Link>
          </Button>
        ) : null}
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                step.done
                  ? "border-border/70 text-muted-foreground"
                  : next?.id === step.id
                    ? "border-border bg-muted/40 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  step.done ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground",
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{step.label}</span>
                <span className="block text-xs text-muted-foreground">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
