"use client";

import { Home } from "lucide-react";

import { cn } from "@/lib/utils";

import { useMenuExperienceOptional } from "./menu-experience";

type MenuHomeLinkProps = {
  onClick?: () => void;
  className?: string;
  label?: string;
};

/** Landing / hub’a dönüş — geri okundan ayırt etmek için home ikonu kullanır. */
export function MenuHomeLink({
  onClick,
  className,
  label = "Ana sayfa",
}: MenuHomeLinkProps) {
  const experience = useMenuExperienceOptional();
  const handleClick = onClick ?? (() => experience?.exitToWelcome());
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("inline-flex items-center gap-1.5 text-sm", className)}
      aria-label={label}
    >
      <Home className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
