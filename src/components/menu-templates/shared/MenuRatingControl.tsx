"use client";

import { Star } from "lucide-react";

type MenuRatingControlProps = {
  ratingAvg: number | null;
  ratingCount: number;
  userRating?: number | null;
  onRate?: (rating: number) => void | Promise<void>;
  readonly?: boolean;
  submitting?: boolean;
  className?: string;
};

function normalizeRating(value: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(5, value));
}

export function MenuRatingControl({
  ratingAvg,
  ratingCount,
  userRating,
  onRate,
  readonly = false,
  submitting = false,
  className,
}: MenuRatingControlProps) {
  const normalizedAvg = normalizeRating(ratingAvg);
  const normalizedUser = normalizeRating(userRating ?? null);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = normalizedUser != null ? value <= normalizedUser : value <= (normalizedAvg ?? 0);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onRate?.(value)}
                disabled={readonly || submitting || !onRate}
                className="disabled:cursor-default"
                aria-label={`${value} yıldız`}
              >
                <Star
                  className={`h-4 w-4 ${
                    active
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-transparent text-muted-foreground/60"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground">
          {normalizedAvg != null ? normalizedAvg.toFixed(1) : "0.0"} ({ratingCount})
        </span>
      </div>
    </div>
  );
}
