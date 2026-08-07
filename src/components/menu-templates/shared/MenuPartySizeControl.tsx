"use client";

import { cn } from "@/lib/utils";

const OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export type MenuPartySizeControlProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
};

export function MenuPartySizeControl({
  value,
  onChange,
  className,
  labelClassName,
  buttonClassName,
  activeButtonClassName,
}: MenuPartySizeControlProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("text-xs font-medium uppercase tracking-[0.14em] opacity-70", labelClassName)}>
        Kaç kişilik?
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "rounded-full border border-current/20 px-3 py-1.5 text-xs transition",
            value == null ? activeButtonClassName : buttonClassName,
          )}
        >
          Tümü
        </button>
        {OPTIONS.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border border-current/20 px-3 py-1.5 text-xs transition",
                active ? activeButtonClassName : buttonClassName,
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
