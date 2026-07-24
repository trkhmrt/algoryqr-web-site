import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { LumiereProductCard } from "./ProductCard";
import { LUMIERE_CATEGORY_HERO, lumiereCategoryImage } from "./styles";

type CategoryViewProps = {
  category: MenuCategoryApiItem;
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryIndex?: number;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function LumiereCategoryView({
  category,
  products,
  searchQuery,
  onSearchChange,
  categoryIndex = 0,
  onOpenProduct,
}: CategoryViewProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      )
    : products;

  const heroImage = lumiereCategoryImage(categoryIndex) || LUMIERE_CATEGORY_HERO;

  return (
    <div>
      <section className="relative h-[280px] w-full overflow-hidden">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-[var(--lm-margin)]">
          <h2 className="lm-headline-lg text-white">{category.name}</h2>
          <p className="lm-body-sm mt-1 text-white/70">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-5 px-[var(--lm-margin)]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] p-1 shadow-lg focus-within:border-[var(--lm-primary)]">
          <div className="flex flex-1 items-center gap-1 px-2 py-3">
            <span className="material-symbols-outlined text-[20px] text-[var(--lm-on-surface-variant)]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="lm-body-lg w-full border-none bg-transparent outline-none placeholder:text-[color-mix(in_srgb,var(--lm-on-surface-variant)_50%,transparent)] focus:ring-0"
              autoFocus={Boolean(q)}
            />
          </div>
        </div>
      </section>

      <section className="mt-8 px-[var(--lm-margin)]">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((item) => (
              <LumiereProductCard
                key={item.productId}
                item={item}
                onOpen={onOpenProduct}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container)] p-8 text-center text-[var(--lm-on-surface-variant)]">
            {q
              ? `"${searchQuery}" için sonuç bulunamadı.`
              : `"${category.name}" kategorisinde henüz ürün yok.`}
          </p>
        )}
      </section>
    </div>
  );
}
