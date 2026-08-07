import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";

import { DenseProductRow, MenuProductScrollSentinel, searchMenuProducts } from "../shared";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  products: MenuProductApiItem[];
  searchQuery: string;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function GlassyGrayCategoryView({
  category,
  products,
  searchQuery,
  onOpenProduct,
}: CategoryViewProps) {
  const filtered = searchMenuProducts(products, searchQuery);
  const q = searchQuery.trim();

  const rowProps = {
    className: "border-white/10",
    imageClassName: "bg-white/5",
    titleClassName: "text-white gg-display",
    priceClassName: "gg-primary",
    descriptionClassName: "gg-muted",
    chipClassName: "bg-white/10 gg-muted",
    accentChipClassName: "bg-[var(--gg-primary)] text-[#1a120e]",
    destructiveChipClassName: "bg-red-500/20 text-red-300",
    imagePlaceholderClassName: "gg-muted",
  };

  return (
    <section>
      <header className="mb-4">
        <h1 className="gg-text-glow gg-display text-2xl font-bold text-white">
          {category.name}
        </h1>
        <p className="gg-muted mt-1 text-sm">{products.length} ürün</p>
      </header>

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
        <p className="gg-glass-heavy gg-muted rounded-2xl p-8 text-center text-sm">
          {q
            ? `“${searchQuery}” için sonuç bulunamadı.`
            : `“${category.name}” kategorisinde henüz ürün yok.`}
        </p>
      )}
      <MenuProductScrollSentinel className="gg-muted flex min-h-8 items-center justify-center py-6 text-sm" />
    </section>
  );
}
