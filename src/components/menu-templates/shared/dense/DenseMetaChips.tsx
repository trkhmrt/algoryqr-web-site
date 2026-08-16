"use client";

import type { MenuProductApiItem } from "@/lib/api";
import { cn } from "@/lib/utils";

import { formatServesPeopleLabel } from "../serves-people";
import { useIsCampaignProduct } from "../campaign-product-context";

type DenseMetaChipsProps = {
  product: MenuProductApiItem;
  className?: string;
  chipClassName?: string;
  accentChipClassName?: string;
  destructiveChipClassName?: string;
  maxAllergens?: number;
  maxTags?: number;
};

export function DenseMetaChips({
  product,
  className,
  chipClassName,
  accentChipClassName,
  destructiveChipClassName,
  maxAllergens = 2,
  maxTags = 2,
}: DenseMetaChipsProps) {
  const isCampaignProduct = useIsCampaignProduct(product.productId);
  const servesLabel = formatServesPeopleLabel(
    product.servesPeopleMin,
    product.servesPeopleMax,
  );
  const allergens = (product.allergens ?? []).slice(0, maxAllergens);
  const tags = (product.tags ?? []).slice(0, maxTags);
  const kcal = product.nutrition?.energyKcal;

  const chips: Array<{ key: string; label: string; variant?: "accent" | "destructive" }> = [];

  if (kcal != null && kcal !== "") {
    chips.push({ key: "kcal", label: `${kcal} kcal` });
  }
  if (servesLabel) {
    chips.push({ key: "serves", label: servesLabel });
  }
  if (product.chefRecommended) {
    chips.push({ key: "chef", label: "Şef önerisi", variant: "accent" });
  }
  if (isCampaignProduct) {
    chips.push({ key: "campaign", label: "Kampanyalı", variant: "accent" });
  }
  for (const allergen of allergens) {
    chips.push({ key: `allergen-${allergen.id}`, label: allergen.name });
  }
  for (const tag of tags) {
    chips.push({ key: `tag-${tag.id}`, label: tag.name });
  }
  if (!product.available) {
    chips.push({ key: "unavailable", label: "Tükendi", variant: "destructive" });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            chip.variant === "accent"
              ? accentChipClassName
              : chip.variant === "destructive"
                ? destructiveChipClassName
                : chipClassName,
          )}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}
