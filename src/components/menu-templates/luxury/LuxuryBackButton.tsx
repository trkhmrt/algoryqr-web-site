import type { ButtonHTMLAttributes } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export const LUXURY_BACK_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-bg)_70%,transparent)] px-2.5 py-1 text-xs font-medium lx-fg backdrop-blur";

type LuxuryBackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function LuxuryBackButton({
  label = "Geri",
  className,
  type = "button",
  ...props
}: LuxuryBackButtonProps) {
  return (
    <button type={type} className={cn(LUXURY_BACK_BUTTON_CLASS, className)} {...props}>
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
