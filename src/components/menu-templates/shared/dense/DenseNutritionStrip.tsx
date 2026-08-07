"use client";

import type { NutritionFacts } from "@/lib/api";
import { cn } from "@/lib/utils";

import { formatNutritionValue } from "./format-nutrition";

type DenseNutritionStripProps = {
  nutrition?: NutritionFacts | null;
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function DenseNutritionStrip({
  nutrition,
  className,
  itemClassName,
  labelClassName,
  valueClassName,
}: DenseNutritionStripProps) {
  const items = [
    { key: "kcal", label: "Kalori", value: formatNutritionValue(nutrition?.energyKcal), unit: "kcal" },
    { key: "protein", label: "Protein", value: formatNutritionValue(nutrition?.protein), unit: "g" },
    { key: "carbs", label: "Karb", value: formatNutritionValue(nutrition?.carbohydrate), unit: "g" },
    { key: "fat", label: "Yağ", value: formatNutritionValue(nutrition?.fat), unit: "g" },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-4 gap-1.5", className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className={cn("rounded-xl px-2 py-2 text-center", itemClassName)}
        >
          <p className={cn("text-[9px] font-medium uppercase tracking-wider", labelClassName)}>
            {item.label}
          </p>
          <p className={cn("mt-0.5 text-sm font-semibold leading-none", valueClassName)}>
            {item.value}
            <span className="ml-0.5 text-[10px] font-normal opacity-70">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
