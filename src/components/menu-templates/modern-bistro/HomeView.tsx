"use client";

import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  filterProductsByNavNode,
  flattenNavCategories,
  formatMenuPrice,
} from "../types";
import { searchMenuProducts } from "../shared/search-products";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useOrderingOptional } from "../shared/ordering-context";
import { pickFeaturedProducts } from "./category-utils";
import { modernBistroCategoryMark } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function ModernBistroHomeView({
  categories,
  products,
  searchQuery,
  onSearchChange,
  onOpenProduct,
}: HomeViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const flatCategories = useMemo(() => flattenNavCategories(categories), [categories]);

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim()) {
      return searchMenuProducts(products, searchQuery);
    }
    if (activeCategoryId == null) return products;
    const match = categories.find((c) => c.categoryId === activeCategoryId);
    if (!match) return products;
    return filterProductsByNavNode(products, match);
  }, [products, searchQuery, activeCategoryId, categories]);

  const featuredProducts = useMemo(
    () => pickFeaturedProducts(activeCategoryId == null && !searchQuery.trim() ? products : []),
    [products, activeCategoryId, searchQuery],
  );

  const categorySections = useMemo(() => {
    if (searchQuery.trim() || activeCategoryId != null) return [];
    const roots = categories.length > 0 ? categories : [];
    if (roots.length === 0) {
      const available = products.filter((p) => p.available !== false);
      if (available.length === 0) return [];
      return [
        {
          key: "all",
          title: "Menü",
          mark: "🔥",
          products: available,
          compact: available.length > 4,
        },
      ];
    }
    return roots.map((category, index) => {
        const sectionProducts = filterProductsByNavNode(products, category).filter(
          (p) => p.available !== false,
        );
        return {
          key: String(category.categoryId),
          title: category.name,
          mark: modernBistroCategoryMark(index + 1),
          products: sectionProducts,
          compact: sectionProducts.length >= 4,
        };
      });
  }, [categories, products, searchQuery, activeCategoryId]);

  const showFeatured =
    activeCategoryId == null &&
    !searchQuery.trim() &&
    featuredProducts.length > 0 &&
    categorySections.length > 0;

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-[var(--mb-border)] bg-[var(--mb-bg)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Menüde ara..."
            className="w-full rounded-full border border-[var(--mb-border)] bg-[var(--mb-surface)] px-4 py-2 text-sm text-[var(--mb-fg)] outline-none transition-shadow placeholder:text-[var(--mb-muted)] focus:border-[var(--mb-primary)] focus:ring-2 focus:ring-[var(--mb-primary)]/10"
          />

          {flatCategories.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              <CategoryPill
                active={activeCategoryId == null}
                onClick={() => setActiveCategoryId(null)}
              >
                Tümü
              </CategoryPill>
              {flatCategories.map((cat) => (
                <CategoryPill
                  key={cat.categoryId}
                  active={activeCategoryId === cat.categoryId}
                  onClick={() => setActiveCategoryId(cat.categoryId)}
                >
                  {cat.name}
                </CategoryPill>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-5 sm:px-6 sm:py-6">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--mb-muted)]">Ürün bulunamadı.</div>
        ) : searchQuery.trim() || activeCategoryId != null ? (
          <ProductSection
            title={searchQuery.trim() ? "Arama sonuçları" : undefined}
            mark={searchQuery.trim() ? "🔎" : undefined}
            products={filteredProducts}
            compact={filteredProducts.length >= 4}
            onOpenProduct={onOpenProduct}
          />
        ) : (
          <>
            {showFeatured ? (
              <ProductSection
                title="Öne Çıkanlar"
                mark="🔥"
                products={featuredProducts}
                compact={false}
                onOpenProduct={onOpenProduct}
              />
            ) : null}
            {categorySections.map((section) => (
              <ProductSection
                key={section.key}
                title={section.title}
                mark={section.mark}
                products={section.products}
                compact={section.compact}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </>
        )}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-xs text-[var(--mb-muted)]" />
        <MenuCategoryScrollSentinel className="flex min-h-2 items-center justify-center" />
      </main>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--mb-primary)] text-[var(--mb-primary-fg)]"
          : "border border-[var(--mb-border)] bg-[var(--mb-surface)] text-[var(--mb-fg)] hover:bg-[#f3f4f6]"
      }`}
    >
      {children}
    </button>
  );
}

function ProductSection({
  title,
  mark,
  products,
  compact,
  onOpenProduct,
}: {
  title?: string;
  mark?: string;
  products: MenuProductApiItem[];
  compact: boolean;
  onOpenProduct: (product: MenuProductApiItem) => void;
}) {
  return (
    <section>
      {title ? (
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--mb-fg)]">
          {mark ? <span aria-hidden>{mark}</span> : null}
          {title}
        </h2>
      ) : null}
      {compact ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <CompactProductCard key={product.productId} product={product} onOpen={onOpenProduct} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <FeaturedProductCard key={product.productId} product={product} onOpen={onOpenProduct} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = formatMenuPrice(product.price, product.currency);
  const unavailable = product.available === false;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-[4/3] overflow-hidden bg-[#f3f4f6]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-semibold text-[var(--mb-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--mb-muted)]">
              {product.description}
            </p>
          ) : null}
          {price ? <p className="text-sm font-semibold text-[var(--mb-fg)]">{price}</p> : null}
        </div>
      </button>
      <div className="flex items-center justify-between px-4 pb-4">
        <span className="text-xs text-[var(--mb-muted)]">
          {unavailable ? "Mevcut değil" : ""}
        </span>
        {!unavailable ? <AddButton product={product} /> : null}
      </div>
    </article>
  );
}

function CompactProductCard({
  product,
  onOpen,
}: {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = formatMenuPrice(product.price, product.currency);
  const unavailable = product.available === false;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="aspect-square overflow-hidden bg-[#f3f4f6]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--mb-fg)]">
            {product.name}
          </h3>
          {price ? <p className="text-sm font-medium text-[var(--mb-accent)]">{price}</p> : null}
        </div>
      </button>
      {!unavailable ? (
        <div className="flex justify-end px-3 pb-3">
          <AddButton product={product} small />
        </div>
      ) : null}
    </article>
  );
}

function AddButton({
  product,
  small,
}: {
  product: MenuProductApiItem;
  small?: boolean;
}) {
  const ordering = useOrderingOptional();
  const [busy, setBusy] = useState(false);

  if (!ordering) return null;

  return (
    <button
      type="button"
      disabled={busy || ordering.loading}
      onClick={async (event) => {
        event.stopPropagation();
        setBusy(true);
        try {
          await ordering.addProduct(product, 1);
        } finally {
          setBusy(false);
        }
      }}
      className={`inline-flex items-center justify-center rounded-full bg-[var(--mb-primary)] text-[var(--mb-primary-fg)] transition-opacity disabled:opacity-50 ${
        small ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-label="Sepete ekle"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
