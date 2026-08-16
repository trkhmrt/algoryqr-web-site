"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  formatPackagePrice,
  formatYearlySavingsBadge,
  formatYearlySavingsLabel,
  resolveYearlySavingsPercent,
  type PackagePricing,
} from "@/lib/package-display";
import { cn } from "@/lib/utils";

interface AnimatedPackagePriceProps {
  pricing: PackagePricing;
  currency: string;
  size?: "default" | "compact";
}

export function AnimatedPackagePrice({
  pricing,
  currency,
  size = "default",
}: AnimatedPackagePriceProps) {
  const compact = size === "compact";
  const amountLabel = formatPackagePrice(pricing.amount, currency);
  const compareLabel =
    pricing.compareAmount != null ? formatPackagePrice(pricing.compareAmount, currency) : null;
  const hasSavings = pricing.yearlySavings != null && pricing.yearlySavings > 0;

  return (
    <div
      className={cn("relative mt-4 overflow-hidden", compact && "mt-3 sm:mt-4")}
      style={{ height: compact ? "5.25rem" : "5.5rem" }}
      aria-live="polite"
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={pricing.period}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.72, ease: [0.4, 0, 0.2, 1] },
          }}
          className="absolute inset-0 flex flex-col"
        >
          <div
            className={cn(
              "flex shrink-0 items-center",
              compact ? "h-5 sm:h-6" : "h-6",
            )}
          >
            {compareLabel ? (
              <span
                className={cn(
                  "truncate text-muted-foreground line-through decoration-muted-foreground/80",
                  compact ? "text-sm sm:text-base" : "text-lg",
                )}
              >
                {compareLabel}
                {pricing.compareSuffix ? (
                  <span
                    className={cn(
                      "ml-1 font-normal",
                      compact ? "text-xs sm:text-sm" : "text-sm",
                    )}
                  >
                    {pricing.compareSuffix}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-x-2",
              compact ? "h-9 sm:h-10" : "h-10",
            )}
          >
            <span
              className={cn(
                "font-bold tracking-tight text-foreground",
                compact ? "text-2xl sm:text-3xl" : "text-3xl",
              )}
            >
              {amountLabel}
            </span>
            {pricing.amount > 0 ? (
              <span className={cn("text-muted-foreground", compact ? "text-xs sm:text-sm" : "text-sm")}>
                {pricing.suffix}
              </span>
            ) : null}
          </div>

          <div className={cn("flex shrink-0 items-center", compact ? "h-5 sm:h-6" : "h-6")}>
            {hasSavings ? (
              <span
                className={cn(
                  "inline-flex max-w-full truncate rounded-full bg-emerald-500/10 font-medium leading-none text-emerald-600 dark:text-emerald-400",
                  compact
                    ? "px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px]"
                    : "px-2 py-0.5 text-[11px]",
                )}
                title={formatYearlySavingsLabel(pricing.yearlySavings!, currency)}
              >
                {formatYearlySavingsBadge(
                  pricing.yearlySavings!,
                  currency,
                  resolveYearlySavingsPercent(pricing),
                )}
              </span>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
