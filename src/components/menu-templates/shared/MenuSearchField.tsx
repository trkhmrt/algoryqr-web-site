"use client";

import { cn } from "@/lib/utils";

import { useMenuLocaleOptional } from "./menu-locale";

export type MenuSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  clearButtonClassName?: string;
  id?: string;
};

export function MenuSearchField({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  clearButtonClassName,
  id = "menu-search",
}: MenuSearchFieldProps) {
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  const resolvedPlaceholder = placeholder ?? t?.searchProducts ?? "Ürün ara…";

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {resolvedPlaceholder}
      </label>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        autoComplete="off"
        className={cn(
          "w-full rounded-xl border border-current/15 bg-transparent py-2.5 pl-10 pr-10 text-sm outline-none transition placeholder:opacity-50 focus:border-current/40",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100",
            clearButtonClassName,
          )}
          aria-label={t?.clearSearch ?? "Aramayı temizle"}
        >
          {t?.clearSearch ?? "Temizle"}
        </button>
      ) : null}
    </div>
  );
}
