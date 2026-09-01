"use client";

import { cn } from "@/lib/utils";

type ModernBistroBrandAvatarProps = {
  businessName: string;
  logoUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

function brandMonogram(businessName: string) {
  const parts = businessName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ModernBistroBrandAvatar({
  businessName,
  logoUrl,
  size = "md",
  className,
}: ModernBistroBrandAvatarProps) {
  const src = logoUrl?.trim();
  const sizeClass = size === "lg" ? "h-20 w-20 text-sm" : "h-14 w-14 text-xs";

  if (src) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--mb-surface)] bg-[var(--mb-surface)] shadow-[var(--mb-card-shadow)]",
          sizeClass,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-4 border-[var(--mb-surface)] bg-[var(--mb-muted-surface)] font-bold uppercase tracking-wide text-[var(--mb-muted)] shadow-[var(--mb-card-shadow)]",
        sizeClass,
        className,
      )}
    >
      {brandMonogram(businessName)}
    </span>
  );
}
