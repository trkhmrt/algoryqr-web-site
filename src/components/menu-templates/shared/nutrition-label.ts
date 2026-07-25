import type { NutritionFacts, NutritionNutrientEntry } from "@/lib/api";

export type NutritionLabelRow = {
  key: string;
  label: string;
  value: string;
  indent?: boolean;
};

function hasValue(value: number | string | null | undefined): boolean {
  return value != null && value !== "";
}

function formatAmount(
  value: number | string | null | undefined,
  unit: string,
): string {
  if (!hasValue(value)) return "";
  return `${value}${unit}`;
}

function formatEntry(entry: NutritionNutrientEntry): string {
  const unit = entry.unit?.trim() || "";
  if (!hasValue(entry.value)) return "";
  return unit ? `${entry.value} ${unit}` : String(entry.value);
}

export function getNutritionBasisLabel(
  basis: NutritionFacts["basis"],
): string | null {
  if (basis === "PER_100G") return "100 g başına";
  if (basis === "PER_100ML") return "100 ml başına";
  return null;
}

export function buildNutritionLabelRows(
  nutrition: NutritionFacts | null | undefined,
): NutritionLabelRow[] {
  if (!nutrition) return [];

  const rows: NutritionLabelRow[] = [];

  if (hasValue(nutrition.energyKj) || hasValue(nutrition.energyKcal)) {
    const parts: string[] = [];
    if (hasValue(nutrition.energyKj)) parts.push(`${nutrition.energyKj} kJ`);
    if (hasValue(nutrition.energyKcal)) parts.push(`${nutrition.energyKcal} kcal`);
    rows.push({ key: "energy", label: "Enerji", value: parts.join(" / ") });
  }

  if (hasValue(nutrition.fat)) {
    rows.push({
      key: "fat",
      label: "Yağ",
      value: formatAmount(nutrition.fat, " g"),
    });
  }
  if (hasValue(nutrition.saturatedFat)) {
    rows.push({
      key: "saturatedFat",
      label: "Doymuş yağ",
      value: formatAmount(nutrition.saturatedFat, " g"),
      indent: true,
    });
  }

  if (hasValue(nutrition.carbohydrate)) {
    rows.push({
      key: "carbohydrate",
      label: "Karbonhidrat",
      value: formatAmount(nutrition.carbohydrate, " g"),
    });
  }
  if (hasValue(nutrition.sugars)) {
    rows.push({
      key: "sugars",
      label: "Şekerler",
      value: formatAmount(nutrition.sugars, " g"),
      indent: true,
    });
  }
  if (hasValue(nutrition.polyols)) {
    rows.push({
      key: "polyols",
      label: "Polioller",
      value: formatAmount(nutrition.polyols, " g"),
      indent: true,
    });
  }
  if (hasValue(nutrition.starch)) {
    rows.push({
      key: "starch",
      label: "Nişasta",
      value: formatAmount(nutrition.starch, " g"),
      indent: true,
    });
  }

  if (hasValue(nutrition.fibre)) {
    rows.push({
      key: "fibre",
      label: "Lif",
      value: formatAmount(nutrition.fibre, " g"),
    });
  }
  if (hasValue(nutrition.protein)) {
    rows.push({
      key: "protein",
      label: "Protein",
      value: formatAmount(nutrition.protein, " g"),
    });
  }
  if (hasValue(nutrition.salt)) {
    rows.push({
      key: "salt",
      label: "Tuz",
      value: formatAmount(nutrition.salt, " g"),
    });
  }

  const vitamins = nutrition.vitaminsAndMinerals ?? [];
  vitamins.forEach((entry, index) => {
    const value = formatEntry(entry);
    const name = entry.name?.trim();
    if (!name || !value) return;
    rows.push({
      key: `vitamin-${index}-${name}`,
      label: name,
      value,
    });
  });

  const others = nutrition.otherNutrients ?? [];
  others.forEach((entry, index) => {
    const value = formatEntry(entry);
    const name = entry.name?.trim();
    if (!name || !value) return;
    rows.push({
      key: `other-${index}-${name}`,
      label: name,
      value,
    });
  });

  return rows;
}

export function hasNutritionFacts(
  nutrition: NutritionFacts | null | undefined,
): boolean {
  return buildNutritionLabelRows(nutrition).length > 0;
}
