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
import { cleverDishScribeCategoryMark } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function CleverDishScribeHomeView({
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
          mark: cleverDishScribeCategoryMark(index + 1),
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
      <div className="sticky top-14 z-30 bg-[var(--cds-bg)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Menüde ara..."
            className="cds-enter w-full rounded-full border border-[var(--cds-border)] bg-[var(--cds-surface)] px-4 py-2 text-sm text-[var(--cds-fg)] outline-none transition-shadow placeholder:text-[var(--cds-muted)] focus:border-[var(--cds-accent)] focus:ring-2 focus:ring-[var(--cds-accent)]/15"
          />

          {flatCategories.length > 0 ? (
            <div className="cds-hscroll scrollbar-none pb-1">
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
          <div className="py-20 text-center text-sm text-[var(--cds-muted)]">Ürün bulunamadı.</div>
        ) : searchQuery.trim() || activeCategoryId != null ? (
          <ProductSection
            title={searchQuery.trim() ? "Arama sonuçları" : undefined}
            mark={searchQuery.trim() ? "🔎" : undefined}
            products={filteredProducts}
            compact={filteredProducts.length >= 4}
            onOpenProduct={onOpenProduct}
            enterClass="cds-enter"
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
                enterClass="cds-enter cds-enter-delay-1"
              />
            ) : null}
            {categorySections.map((section, index) => (
              <ProductSection
                key={section.key}
                title={section.title}
                mark={section.mark}
                products={section.products}
                compact={section.compact}
                onOpenProduct={onOpenProduct}
                enterClass={`cds-enter cds-enter-delay-${Math.min(index + 2, 4)}`}
              />
            ))}
          </>
        )}

        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6 text-xs text-[var(--cds-muted)]" />
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
      className={`cds-pill shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
        active
          ? "border border-[var(--cds-primary)] text-[var(--cds-fg)]"
          : "border border-transparent text-[var(--cds-muted)] hover:text-[var(--cds-fg)]"
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
  enterClass,
}: {
  title?: string;
  mark?: string;
  products: MenuProductApiItem[];
  compact: boolean;
  onOpenProduct: (product: MenuProductApiItem) => void;
  enterClass?: string;
}) {
  return (
    <section className={enterClass}>
      {title ? (
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--cds-fg)]">
          {mark ? <span aria-hidden>{mark}</span> : null}
          {title}
        </h2>
      ) : null}
      {compact ? (
        <div className="cds-hscroll scrollbar-none -mx-1 px-1">
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
  const ordering = useOrderingOptional();

  return (
    <article className="cds-card overflow-hidden rounded-2xl border border-[var(--cds-border)] bg-[var(--cds-surface)] shadow-[var(--cds-glow)]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="cds-card-image aspect-[4/3] overflow-hidden bg-[#1f1f1f]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-semibold text-[var(--cds-fg)]">{product.name}</h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--cds-muted)]">
              {product.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between pt-1">
            {price ? <p className="text-sm font-semibold text-[var(--cds-accent)]">{price}</p> : <span />}
            {!unavailable && ordering ? (
              <AddButton product={product} />
            ) : unavailable ? (
              <span className="text-xs text-[var(--cds-muted)]">Mevcut değil</span>
            ) : null}
          </div>
        </div>
      </button>
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
  const ordering = useOrderingOptional();

  return (
    <article className="cds-card w-[9.5rem] overflow-hidden rounded-2xl border border-[var(--cds-border)] bg-[var(--cds-surface)] sm:w-[10.5rem]">
      <button type="button" onClick={() => onOpen(product)} className="block w-full text-left">
        <div className="cds-card-image aspect-square overflow-hidden bg-[#1f1f1f]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl opacity-30">🍽️</div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--cds-fg)]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            {price ? <p className="text-sm font-medium text-[var(--cds-accent)]">{price}</p> : <span />}
            {!unavailable && ordering ? <AddButton product={product} small /> : null}
          </div>
        </div>
      </button>
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
      className={`cds-add-tap inline-flex items-center justify-center rounded-full text-[var(--cds-muted)] transition-colors hover:text-[var(--cds-fg)] disabled:opacity-50 ${
        small ? "h-7 w-7" : "h-8 w-8"
      }`}
      aria-label="Sepete ekle"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[1.75]" />}
    </button>
  );
}
