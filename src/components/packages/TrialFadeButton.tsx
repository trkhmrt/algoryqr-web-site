"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface TrialFadeButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function TrialFadeButton({ href, label, className }: TrialFadeButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-11 w-full min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-8",
        "border border-[hsl(var(--chart-violet)/0.35)] text-sm font-medium text-foreground sm:text-base",
        "bg-gradient-to-b from-[hsl(var(--chart-violet)/0.14)] via-[hsl(var(--chart-violet)/0.06)] to-transparent",
        "transition-colors duration-300 hover:border-[hsl(var(--chart-violet)/0.48)] hover:bg-[hsl(var(--chart-violet)/0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--chart-violet)/0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-[hsl(var(--chart-violet))]" />
      {label}
      <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
