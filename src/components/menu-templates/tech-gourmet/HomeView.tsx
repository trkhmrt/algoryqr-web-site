"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  flattenNavCategories,
} from "../types";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { searchMenuProducts } from "../shared/search-products";
import { MenuCategoryScrollSentinel } from "../shared/MenuCategoryScrollSentinel";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";
import { useOrderingOptional } from "../shared/ordering-context";
import { Tx } from "@/components/google-translate-provider";
import { techGourmetCategoryMark } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function TechGourmetHomeView({
  menu,
  categories,
  products,
  searchQuery,
  onSearchChange,
  onSelectCategory,
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

    const collectIds = (node: TaxonomyNavNode): number[] => [
      node.categoryId,
      ...node.children.flatMap(collectIds),
    ];
    const ids = new Set(collectIds(match));
    return products.filter(
      (p) =>
        (p.subCategoryId != null && ids.has(p.subCategoryId)) ||
        (p.mainCategoryId != null && ids.has(p.mainCategoryId + 1_000_000)),
    );
  }, [products, searchQuery, activeCategoryId, categories]);

  const slogan = menu.slogan?.trim() || "Hassas mühendislikle hazırlanmış mutfak deneyimleri.";

  return (
    <div className="pb-20">
      {/* Hero header */}
      <div
        className="px-4 pb-6 pt-8 sm:px-6"
        style={{ borderBottom: "1px solid var(--tg-outline-variant)" }}
      >
        <div className="mx-auto max-w-6xl">
          <p
            className="mb-1 text-xs uppercase tracking-widest"
            style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
          >
            SYS.MENU — AKTIF
          </p>
          <h1
            className="text-4xl sm:text-5xl uppercase leading-none tracking-tighter"
            style={{
              fontFamily: "var(--tg-font-display)",
              fontWeight: 800,
              color: "var(--tg-fg)",
              letterSpacing: "-0.04em",
            }}
          >
            {menu.businessName}
          </h1>
          {slogan ? (
            <p
              className="mt-2 max-w-xl text-sm"
              style={{ color: "var(--tg-fg-variant)" }}
            >
              {slogan}
            </p>
          ) : null}
        </div>
      </div>

      {/* Search + Category filters */}
      <div
        className="sticky top-16 z-30 px-4 py-3 sm:px-6"
        style={{
          backgroundColor: "var(--tg-bg)",
          borderBottom: "1px solid var(--tg-outline-variant)",
        }}
      >
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ÜRÜN ARA..."
              className="w-full py-2 pl-3 pr-4 text-sm outline-none"
              style={{
                backgroundColor: "var(--tg-surface-container)",
                border: "1px solid var(--tg-outline-variant)",
                color: "var(--tg-fg)",
                fontFamily: "var(--tg-font-mono)",
                fontSize: "12px",
                letterSpacing: "0.05em",
              }}
            />
          </div>

          {flatCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className="flex-shrink-0 px-3 py-1.5 text-xs transition-colors"
                style={{
                  fontFamily: "var(--tg-font-mono)",
                  letterSpacing: "0.06em",
                  backgroundColor: activeCategoryId == null ? "var(--tg-primary)" : "var(--tg-surface-container)",
                  color: activeCategoryId == null ? "var(--tg-on-primary)" : "var(--tg-fg-variant)",
                  border: `1px solid ${activeCategoryId == null ? "var(--tg-primary)" : "var(--tg-outline-variant)"}`,
                }}
              >
                TÜM
              </button>
              {flatCategories.map((cat, i) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => {
                    const node = categories.find((c) => c.categoryId === cat.categoryId) ?? null;
                    if (node) {
                      setActiveCategoryId(cat.categoryId);
                      onSelectCategory(node);
                    }
                  }}
                  className="flex-shrink-0 px-3 py-1.5 text-xs transition-colors"
                  style={{
                    fontFamily: "var(--tg-font-mono)",
                    letterSpacing: "0.06em",
                    paddingLeft: cat.depth > 0 ? "20px" : undefined,
                    backgroundColor: activeCategoryId === cat.categoryId ? "var(--tg-primary)" : "var(--tg-surface-container)",
                    color: activeCategoryId === cat.categoryId ? "var(--tg-on-primary)" : "var(--tg-fg-variant)",
                    border: `1px solid ${activeCategoryId === cat.categoryId ? "var(--tg-primary)" : "var(--tg-outline-variant)"}`,
                  }}
                >
                  {techGourmetCategoryMark(i)} {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p
              className="text-sm uppercase tracking-widest"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
            >
              ÜRÜN BULUNAMADI
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: "var(--tg-outline-variant)" }}
          >
            {filteredProducts.map((product, index) => (
              <TechProductCard
                key={product.productId}
                product={product}
                index={index}
                onOpen={onOpenProduct}
              />
            ))}
          </div>
        )}
        <MenuProductScrollSentinel
          className="flex min-h-8 items-center justify-center py-6 text-xs"
        />
        <MenuCategoryScrollSentinel
          className="flex min-h-2 items-center justify-center"
        />
      </main>
    </div>
  );
}

function TechProductCard({
  product,
  index,
  onOpen,
}: {
  product: MenuProductApiItem;
  index: number;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const ordering = useOrderingOptional();
  const [busy, setBusy] = useState(false);
  const price = useMenuPriceDisplay(product.price, product.currency);
  const isUnavailable = product.available === false;

  return (
    <article
      className="group relative flex flex-col transition-colors"
      style={{
        backgroundColor: "var(--tg-surface-container)",
        minHeight: "200px",
        opacity: isUnavailable ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(product)}
        disabled={isUnavailable}
        className="flex flex-1 flex-col text-left"
        style={{ cursor: isUnavailable ? "not-allowed" : "pointer" }}
      >
        {/* ID badge */}
        <div
          className="tg-id-badge"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "var(--tg-bg)",
            border: "1px solid var(--tg-outline-variant)",
            padding: "3px 7px",
            fontFamily: "var(--tg-font-mono)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            color: "var(--tg-primary)",
            zIndex: 10,
          }}
        >
          ID: {String(index + 1).padStart(2, "0")}
        </div>

        {/* Image */}
        {product.imageUrl ? (
          <div className="relative w-full overflow-hidden" style={{ height: "160px" }}>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ filter: "grayscale(20%) contrast(1.05)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, var(--tg-surface-container) 0%, transparent 60%)" }}
            />
          </div>
        ) : (
          <div
            className="flex w-full items-center justify-center"
            style={{ height: "80px", backgroundColor: "var(--tg-surface-high)" }}
          >
            <span
              className="text-3xl"
              style={{ color: "var(--tg-primary)", fontFamily: "var(--tg-font-mono)" }}
            >
              ◆
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            {(product.subCategoryName || product.mainCategoryName) && (
              <p
                className="mb-1 text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.08em" }}
              >
                <Tx>{String(product.subCategoryName || product.mainCategoryName)}</Tx>
              </p>
            )}
            <h3
              className="text-base uppercase leading-tight"
              style={{
                fontFamily: "var(--tg-font-display)",
                fontWeight: 700,
                color: "var(--tg-fg)",
                letterSpacing: "-0.01em",
              }}
            >
              {product.name}
            </h3>
            {product.description && (
              <p
                className="mt-1 line-clamp-2 text-xs"
                style={{ color: "var(--tg-fg-variant)" }}
              >
                {product.description}
              </p>
            )}
          </div>

          <div
            className="mt-3 flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid var(--tg-outline-variant)" }}
          >
            {price ? (
              <span
                className="text-sm"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)", letterSpacing: "0.05em" }}
              >
                {price}
              </span>
            ) : (
              <span />
            )}
            {isUnavailable ? (
              <span
                className="text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.06em" }}
              >
                MEVCUT DEĞİL
              </span>
            ) : (
              <span
                className="text-xs uppercase opacity-0 transition-opacity group-hover:opacity-100"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)", letterSpacing: "0.06em" }}
              >
                İNCELE →
              </span>
            )}
          </div>
        </div>
      </button>

      {ordering && !isUnavailable ? (
        <button
          type="button"
          disabled={busy || ordering.loading}
          onClick={async () => {
            setBusy(true);
            try {
              await ordering.addProduct(product, 1);
            } finally {
              setBusy(false);
            }
          }}
          className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--tg-primary)", color: "var(--tg-on-primary)", zIndex: 20 }}
          aria-label="Sepete ekle"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </article>
  );
}
