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
        "border border-primary/35 text-sm font-medium text-foreground sm:text-base",
        "bg-gradient-to-b from-primary/12 via-primary/6 to-transparent",
        "transition-colors duration-300 hover:border-primary/48 hover:bg-primary/8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      {label}
      <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
