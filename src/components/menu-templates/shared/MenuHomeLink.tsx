"use client";

import Link from "next/link";
import { Home } from "lucide-react";

import { publicMenuPath } from "@/lib/public-menu-paths";
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
      href={publicMenuPath(qrId)}
      className={cn("inline-flex items-center gap-1.5 text-sm", className)}
      aria-label={label}
    >
      <Home className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
