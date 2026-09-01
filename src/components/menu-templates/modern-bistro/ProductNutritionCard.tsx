"use client";

import type { NutritionFacts } from "@/lib/api";

import { formatNutritionValue } from "../shared/dense/format-nutrition";
import type { MenuStrings } from "../shared/menu-locale";

type NutritionRow = {
  label: string;
  value: string;
};

function buildRows(nutrition: NutritionFacts, t: MenuStrings): NutritionRow[] {
  return [
    {
      label: t.energy,
      value: formatNutritionValue(nutrition.energyKcal)
        ? `${formatNutritionValue(nutrition.energyKcal)} kcal`
        : "",
    },
    {
      label: t.protein,
      value: formatNutritionValue(nutrition.protein)
        ? `${formatNutritionValue(nutrition.protein)} g`
        : "",
    },
    {
      label: t.fat,
      value: formatNutritionValue(nutrition.fat) ? `${formatNutritionValue(nutrition.fat)} g` : "",
    },
    {
      label: t.carbs,
      value: formatNutritionValue(nutrition.carbohydrate)
        ? `${formatNutritionValue(nutrition.carbohydrate)} g`
        : "",
    },
    {
      label: t.fiber,
      value: formatNutritionValue(nutrition.fibre)
        ? `${formatNutritionValue(nutrition.fibre)} g`
        : "",
    },
    {
      label: t.salt,
      value: formatNutritionValue(nutrition.salt)
        ? `${formatNutritionValue(nutrition.salt)} g`
        : "",
    },
  ].filter((row) => row.value);
}

function splitColumns(rows: NutritionRow[]) {
  const midpoint = Math.ceil(rows.length / 2);
  return [rows.slice(0, midpoint), rows.slice(midpoint)] as const;
}

type ModernBistroProductNutritionCardProps = {
  nutrition: NutritionFacts;
  labels: MenuStrings;
};

function NutritionColumn({ rows }: { rows: NutritionRow[] }) {
  return (
    <div className="min-w-0 flex-1 divide-y divide-[var(--mb-border)]">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="text-sm text-[var(--mb-muted)]">{row.label}</span>
          <span className="text-sm font-medium text-[var(--mb-fg)]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ModernBistroProductNutritionCard({
  nutrition,
  labels,
}: ModernBistroProductNutritionCardProps) {
  const rows = buildRows(nutrition, labels);
  if (rows.length === 0) return null;

  const [left, right] = splitColumns(rows);

  return (
    <section className="rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] p-4">
      <h2 className="text-base font-bold text-[var(--mb-fg)]">{labels.nutritionValues}</h2>
      <div className="mt-3 flex gap-4">
        <NutritionColumn rows={left} />
        {right.length > 0 ? <NutritionColumn rows={right} /> : null}
      </div>
    </section>
  );
}
