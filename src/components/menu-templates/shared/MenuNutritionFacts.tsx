import type { NutritionFacts } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  buildNutritionLabelRows,
  getNutritionBasisLabel,
  hasNutritionFacts,
} from "./nutrition-label";

export type MenuNutritionFactsProps = {
  nutrition?: NutritionFacts | null;
  className?: string;
  titleClassName?: string;
  basisClassName?: string;
  rowClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  footnoteClassName?: string;
  title?: string;
};

export function MenuNutritionFacts({
  nutrition,
  className,
  titleClassName,
  basisClassName,
  rowClassName,
  labelClassName,
  valueClassName,
  footnoteClassName,
  title = "Besin değerleri",
}: MenuNutritionFactsProps) {
  if (!hasNutritionFacts(nutrition)) return null;

  const rows = buildNutritionLabelRows(nutrition);
  const basisLabel = getNutritionBasisLabel(nutrition?.basis);

  return (
    <section className={cn("w-full", className)} aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h3 className={cn("text-lg font-semibold tracking-tight", titleClassName)}>
          {title}
        </h3>
        {basisLabel ? (
          <span className={cn("text-xs opacity-70", basisClassName)}>
            {basisLabel}
          </span>
        ) : null}
      </div>
      <dl className="space-y-0">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex items-baseline justify-between gap-4 border-b border-current/10 py-2.5 last:border-b-0",
              row.indent && "pl-4",
              rowClassName,
            )}
          >
            <dt className={cn("text-sm opacity-80", labelClassName)}>{row.label}</dt>
            <dd className={cn("text-sm font-semibold tabular-nums", valueClassName)}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className={cn("mt-4 text-[11px] italic opacity-60", footnoteClassName)}>
        * Değerler standart porsiyonlara göre yaklaşıktır.
      </p>
    </section>
  );
}
