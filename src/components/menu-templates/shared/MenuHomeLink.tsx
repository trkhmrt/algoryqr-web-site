"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home } from "lucide-react";

import { buildPublicMenuContentPath } from "@/lib/public-menu-paths";
import { cn } from "@/lib/utils";

type MenuHomeLinkProps = {
  qrId: number | string;
  onClick?: () => void;
  className?: string;
  label?: string;
};

export function MenuHomeLink({
  qrId,
  onClick,
  className,
  label = "Ana sayfa",
}: MenuHomeLinkProps) {
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t")?.trim() || undefined;
  const href = buildPublicMenuContentPath(qrId, { tableToken });

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("inline-flex items-center gap-1.5 text-sm", className)}
        aria-label={label}
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-1.5 text-sm", className)}
      aria-label={label}
    >
      <Home className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
