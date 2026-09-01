"use client";

import { cn } from "@/lib/utils";

import { MODERN_BISTRO_BRAND_AVATAR } from "./styles";

type ModernBistroBrandAvatarProps = {
  businessName: string;
  logoUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

export function ModernBistroBrandAvatar({
  businessName,
  logoUrl,
  size = "md",
  className,
}: ModernBistroBrandAvatarProps) {
  const src = logoUrl?.trim() || MODERN_BISTRO_BRAND_AVATAR;
  const sizeClass = size === "lg" ? "h-20 w-20" : "h-14 w-14";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--mb-surface)] bg-black shadow-[var(--mb-card-shadow)]",
        sizeClass,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={businessName}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
