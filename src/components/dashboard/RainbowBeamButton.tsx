"use client";

import { Loader2 } from "lucide-react";

type RainbowBeamButtonProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  onClick?: () => void;
};

export function RainbowBeamButton({
  className,
  disabled,
  loading,
  label = "Akıllı Özet",
  onClick,
}: RainbowBeamButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`rainbow-beam shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {label}
      </span>
    </button>
  );
}
