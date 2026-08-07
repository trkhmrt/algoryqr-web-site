import type { MenuProductApiItem } from "@/lib/api";

import type { TaxonomyNavNode } from "../types";
import {
  DenseProductRow,
  MenuCategoryRail,
  MenuProductScrollSentinel,
  resolveNavNodeFromRailCategory,
  searchMenuProducts,
  taxonomyNavNodesToRailCategories,
} from "../shared";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryIndex?: number;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LumiereCategoryView({
  category,
  categories,
  products,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onOpenProduct,
}: CategoryViewProps) {
  const filtered = searchMenuProducts(products, searchQuery);
  const navCategories = taxonomyNavNodesToRailCategories(categories);

  const rowProps = {
    className: "border-[var(--lm-outline-variant)]",
    imageClassName: "bg-[var(--lm-surface-container)]",
    titleClassName: "text-[var(--lm-on-surface)]",
    priceClassName: "text-[var(--lm-primary)]",
    descriptionClassName: "text-[var(--lm-on-surface-variant)]",
    chipClassName: "bg-[var(--lm-surface-container)] text-[var(--lm-on-surface-variant)]",
    accentChipClassName: "bg-[var(--lm-primary)] text-white",
    destructiveChipClassName: "bg-[var(--lm-primary-container)] text-white",
    imagePlaceholderClassName: "text-[var(--lm-on-surface-variant)]",
  };

  return (
    <div>
      <header className="border-b border-[var(--lm-outline-variant)] px-4 py-4">
        <h2 className="lm-headline-lg text-[var(--lm-on-surface)]">{category.name}</h2>
        <p className="lm-body-sm mt-1 text-[var(--lm-on-surface-variant)]">
          {products.length} ürün
        </p>
      </header>

      <div className="sticky top-14 z-20 border-b border-[var(--lm-outline-variant)] bg-[color-mix(in_srgb,var(--lm-surface)_92%,transparent)] px-4 py-2 backdrop-blur">
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`${category.name} içinde ara…`}
          className="w-full rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] px-3 py-2.5 text-sm text-[var(--lm-on-surface)] outline-none focus:border-[var(--lm-primary)]"
        />
        <div className="mt-2">
          <MenuCategoryRail
            categories={navCategories}
            activeKey={`cat-${category.categoryId}`}
            onSelect={(cat) => {
              const found = resolveNavNodeFromRailCategory(categories, cat);
              if (found) onSelectCategory(found);
            }}
            activeChipClassName="bg-[var(--lm-primary)] text-white"
            inactiveChipClassName="bg-[var(--lm-surface-container)] text-[var(--lm-on-surface)] ring-1 ring-[var(--lm-outline-variant)]"
          />
        </div>
      </div>

      <section className="px-4 pt-3">
        {filtered.length > 0 ? (
          <div>
            {filtered.map((item) => (
              <DenseProductRow
                key={item.productId}
                item={item}
                onOpen={onOpenProduct}
                {...rowProps}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-8 text-center text-[var(--lm-on-surface-variant)]">
            {searchQuery.trim()
              ? "Aramanızla eşleşen ürün bulunamadı."
              : "Bu kategoride henüz ürün yok."}
          </p>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-sm text-[var(--lm-on-surface-variant)]" />
      </section>
    </div>
  );
}
