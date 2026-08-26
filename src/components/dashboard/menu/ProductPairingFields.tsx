"use client";

import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/dashboard/menu/SearchableMultiSelect";
import type { MainCategoryApiItem, MenuProductApiItem } from "@/lib/api";

export type ProductPairingsForm = {
  productIds: number[];
  mainCategoryIds: number[];
  subCategoryIds: number[];
};

export type ProductPairingsInput = {
  productIds?: number[];
  mainCategoryIds?: number[];
  subCategoryIds?: number[];
};

export const emptyPairings = (): ProductPairingsForm => ({
  productIds: [],
  mainCategoryIds: [],
  subCategoryIds: [],
});

export function normalizePairings(pairings?: ProductPairingsInput | null): ProductPairingsForm {
  return {
    productIds: pairings?.productIds ?? [],
    mainCategoryIds: pairings?.mainCategoryIds ?? [],
    subCategoryIds: pairings?.subCategoryIds ?? [],
  };
}

type ProductPairingFieldsProps = {
  pairings: ProductPairingsForm;
  onChange: (next: ProductPairingsForm) => void;
  products: MenuProductApiItem[];
  categories: MainCategoryApiItem[];
  excludeProductId?: number;
  disabled?: boolean;
};

function categoryValues(pairings: ProductPairingsForm): string[] {
  return [
    ...pairings.mainCategoryIds.map((id) => `main:${id}`),
    ...pairings.subCategoryIds.map((id) => `sub:${id}`),
  ];
}

function parseCategoryValues(values: string[]): Pick<
  ProductPairingsForm,
  "mainCategoryIds" | "subCategoryIds"
> {
  const mainCategoryIds: number[] = [];
  const subCategoryIds: number[] = [];
  for (const value of values) {
    const [kind, raw] = value.split(":");
    const id = Number(raw);
    if (!Number.isSafeInteger(id) || id <= 0) continue;
    if (kind === "main") mainCategoryIds.push(id);
    if (kind === "sub") subCategoryIds.push(id);
  }
  return { mainCategoryIds, subCategoryIds };
}

export function ProductPairingFields({
  pairings,
  onChange,
  products,
  categories,
  excludeProductId,
  disabled = false,
}: ProductPairingFieldsProps) {
  const productOptions = products
    .filter((product) => product.productId !== excludeProductId)
    .map((product) => ({
      value: String(product.productId),
      label: product.name,
    }));

  const categoryOptions = categories.flatMap((main) => [
    { value: `main:${main.id}`, label: `${main.name} (tüm kategori)` },
    ...(main.subs ?? []).map((sub) => ({
      value: `sub:${sub.id}`,
      label: `${sub.name} (${main.name})`,
    })),
  ]);

  return (
    <div className="space-y-3 rounded-md border border-border/60 p-3">
      <p className="text-xs font-medium text-foreground">Yanında ne iyi gider</p>
      <p className="text-xs text-muted-foreground">
        Tek tek ürün seçin veya tüm bir kategoriyi önerin. İkisini birlikte kullanabilirsiniz.
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs">Ürünler</Label>
        <SearchableMultiSelect
          values={pairings.productIds.map(String)}
          onValuesChange={(values) =>
            onChange({
              ...pairings,
              productIds: values.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0),
            })
          }
          options={productOptions}
          placeholder="Ürün seçin"
          searchPlaceholder="Ürün ara..."
          emptyText="Ürün bulunamadı."
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Kategori öner</Label>
        <SearchableMultiSelect
          values={categoryValues(pairings)}
          onValuesChange={(values) => onChange({ ...pairings, ...parseCategoryValues(values) })}
          options={categoryOptions}
          placeholder="Tüm kategoriyi öner"
          searchPlaceholder="Kategori ara..."
          emptyText="Kategori bulunamadı."
          disabled={disabled}
        />
      </div>
    </div>
  );
}
