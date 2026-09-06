export type MenuProductOptionApiItem = {
  optionId: number;
  name: string;
  priceDelta?: number | string;
  available: boolean;
  sortOrder: number;
};

export type MenuProductOptionGroupKind =
  | "SIZE"
  | "CHOICE"
  | "EXTRA"
  | "REMOVAL"
  | "PORTION"
  | "CUSTOM";

export type MenuProductOptionUnit = "NONE" | "PIECE" | "GRAM" | "ML" | "LITRE";

export type MenuProductOptionGroupApiItem = {
  groupId: number;
  name: string;
  kind?: MenuProductOptionGroupKind | string;
  unit?: MenuProductOptionUnit | string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: MenuProductOptionApiItem[];
};

export type SelectedOrderOption = {
  groupId?: number;
  groupName?: string;
  optionId?: number;
  optionName?: string;
  priceDelta?: number | string;
};

export const OPTION_GROUP_KINDS: Array<{
  value: MenuProductOptionGroupKind;
  label: string;
  hint: string;
  defaultName: string;
  minSelect: string;
  maxSelect: string;
  unit: MenuProductOptionUnit;
}> = [
  {
    value: "SIZE",
    label: "Boyut",
    hint: "Küçük / Orta / Büyük — tek zorunlu seçim",
    defaultName: "Boyut",
    minSelect: "1",
    maxSelect: "1",
    unit: "NONE",
  },
  {
    value: "CHOICE",
    label: "Seçim",
    hint: "Sos, pişirme, içecek tercihi — tek seçim",
    defaultName: "Seçim",
    minSelect: "1",
    maxSelect: "1",
    unit: "NONE",
  },
  {
    value: "EXTRA",
    label: "Ekstra",
    hint: "Ekstra peynir, bacon vb. — çoklu isteğe bağlı",
    defaultName: "Ekstralar",
    minSelect: "0",
    maxSelect: "10",
    unit: "NONE",
  },
  {
    value: "REMOVAL",
    label: "Çıkar",
    hint: "Soğan istemiyorum vb. — çoklu isteğe bağlı",
    defaultName: "Çıkarılacaklar",
    minSelect: "0",
    maxSelect: "20",
    unit: "NONE",
  },
  {
    value: "PORTION",
    label: "Porsiyon / miktar",
    hint: "Adet, gram, ml, litre — tek seçim",
    defaultName: "Porsiyon",
    minSelect: "1",
    maxSelect: "1",
    unit: "PIECE",
  },
  {
    value: "CUSTOM",
    label: "Özel",
    hint: "Serbest isim ve seçim kuralları",
    defaultName: "",
    minSelect: "0",
    maxSelect: "1",
    unit: "NONE",
  },
];

export const OPTION_UNITS: Array<{
  value: MenuProductOptionUnit;
  label: string;
  suffix: string;
}> = [
  { value: "NONE", label: "Yok", suffix: "" },
  { value: "PIECE", label: "Adet", suffix: "adet" },
  { value: "GRAM", label: "Gram", suffix: "g" },
  { value: "ML", label: "Mililitre", suffix: "ml" },
  { value: "LITRE", label: "Litre", suffix: "L" },
];

const KIND_BY_VALUE = Object.fromEntries(
  OPTION_GROUP_KINDS.map((item) => [item.value, item]),
) as Record<MenuProductOptionGroupKind, (typeof OPTION_GROUP_KINDS)[number]>;

const UNIT_BY_VALUE = Object.fromEntries(
  OPTION_UNITS.map((item) => [item.value, item]),
) as Record<MenuProductOptionUnit, (typeof OPTION_UNITS)[number]>;

export function normalizeOptionKind(
  value?: string | null,
): MenuProductOptionGroupKind {
  if (!value) return "CUSTOM";
  const upper = value.toUpperCase();
  return upper in KIND_BY_VALUE ? (upper as MenuProductOptionGroupKind) : "CUSTOM";
}

export function normalizeOptionUnit(
  value?: string | null,
  kind: MenuProductOptionGroupKind = "CUSTOM",
): MenuProductOptionUnit {
  if (kind !== "PORTION") return "NONE";
  if (!value) return "PIECE";
  const upper = value.toUpperCase();
  if (upper === "NONE") return "PIECE";
  return upper in UNIT_BY_VALUE ? (upper as MenuProductOptionUnit) : "PIECE";
}

export function optionKindLabel(kind?: string | null): string {
  return KIND_BY_VALUE[normalizeOptionKind(kind)].label;
}

export function optionUnitSuffix(unit?: string | null, kind?: string | null): string {
  const normalizedKind = normalizeOptionKind(kind);
  const normalizedUnit = normalizeOptionUnit(unit, normalizedKind);
  return UNIT_BY_VALUE[normalizedUnit]?.suffix ?? "";
}

export function formatOptionGroupHeading(
  group: Pick<MenuProductOptionGroupApiItem, "name" | "kind" | "unit">,
): string {
  const suffix = optionUnitSuffix(group.unit, group.kind);
  if (!suffix) return group.name;
  return `${group.name} (${suffix})`;
}

export function productHasOptions(
  product: { optionGroups?: MenuProductOptionGroupApiItem[] | null } | null | undefined,
): boolean {
  return (product?.optionGroups?.length ?? 0) > 0;
}

export function cartLineKey(productId: number, selectedOptionIds: number[] = []): string {
  const ids = [...selectedOptionIds].filter((id) => Number.isFinite(id) && id > 0).sort((a, b) => a - b);
  return `${productId}:${ids.join(",")}`;
}

export function selectedOptionIdsFromSnapshot(
  selectedOptions: SelectedOrderOption[] | null | undefined,
): number[] {
  if (!selectedOptions?.length) return [];
  return selectedOptions
    .map((item) => item.optionId)
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
}

export function optionDeltaTotal(
  groups: MenuProductOptionGroupApiItem[] | undefined,
  selectedOptionIds: number[],
): number {
  if (!groups?.length || selectedOptionIds.length === 0) return 0;
  const selected = new Set(selectedOptionIds);
  let total = 0;
  for (const group of groups) {
    for (const option of group.options ?? []) {
      if (!selected.has(option.optionId)) continue;
      const raw = option.priceDelta;
      const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? 0));
      total += Number.isFinite(n) ? n : 0;
    }
  }
  return total;
}

export function formatSelectedOptionsLabel(
  selectedOptions: SelectedOrderOption[] | null | undefined,
): string | null {
  if (!selectedOptions?.length) return null;
  const names = selectedOptions
    .map((item) => item.optionName?.trim())
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : null;
}

export function areOptionSelectionsValid(
  groups: MenuProductOptionGroupApiItem[] | undefined,
  selectedOptionIds: number[],
): boolean {
  if (!groups?.length) return true;
  const selected = new Set(selectedOptionIds);
  for (const group of groups) {
    const count = (group.options ?? []).filter((option) => selected.has(option.optionId)).length;
    if (count < group.minSelect || count > group.maxSelect) return false;
  }
  return true;
}
