"use client";

import { ArrowLeft } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { formatMenuPrice } from "../types";
import { MenuProductScrollSentinel } from "../shared/MenuProductScrollSentinel";

type CategoryViewProps = {
  category: TaxonomyNavNode;
  categories: TaxonomyNavNode[];
  products: MenuProductApiItem[];
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function TechGourmetCategoryView({
  category,
  products,
  onHome,
  onOpenProduct,
}: CategoryViewProps) {
  const categoryProducts = products.filter(
    (p) =>
      p.subCategoryId === category.subCategoryId ||
      p.mainCategoryId === category.mainCategoryId,
  );

  return (
    <div className="pb-20">
      {/* Category header */}
      <div
        className="px-4 py-6 sm:px-6"
        style={{ borderBottom: "1px solid var(--tg-outline-variant)" }}
      >
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={onHome}
            className="mb-4 flex items-center gap-2 transition-colors"
            style={{ fontFamily: "var(--tg-font-mono)", fontSize: "11px", letterSpacing: "0.08em", color: "var(--tg-fg-variant)" }}
          >
            <ArrowLeft size={14} />
            MENÜYE DÖN
          </button>
          <p
            className="mb-1 text-xs uppercase tracking-widest"
            style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
          >
            KATEGORİ — {categoryProducts.length} ÜRÜN
          </p>
          <h2
            className="text-3xl uppercase leading-none tracking-tighter"
            style={{
              fontFamily: "var(--tg-font-display)",
              fontWeight: 800,
              color: "var(--tg-fg)",
              letterSpacing: "-0.04em",
            }}
          >
            {category.name}
          </h2>
        </div>
      </div>

      {/* Products */}
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {categoryProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p
              className="text-sm uppercase tracking-widest"
              style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)" }}
            >
              BU KATEGORİDE ÜRÜN BULUNMUYOR
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: "var(--tg-outline-variant)" }}
          >
            {categoryProducts.map((product, index) => (
              <CategoryProductCard
                key={product.productId}
                product={product}
                index={index}
                onOpen={onOpenProduct}
              />
            ))}
          </div>
        )}
        <MenuProductScrollSentinel className="flex min-h-8 items-center justify-center py-6" />
      </main>
    </div>
  );
}

function CategoryProductCard({
  product,
  index,
  onOpen,
}: {
  product: MenuProductApiItem;
  index: number;
  onOpen: (product: MenuProductApiItem) => void;
}) {
  const price = formatMenuPrice(product.price, product.currency);
  const isUnavailable = product.available === false;

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      disabled={isUnavailable}
      className="group relative flex flex-col text-left transition-colors"
      style={{
        backgroundColor: "var(--tg-surface-container)",
        minHeight: "180px",
        opacity: isUnavailable ? 0.5 : 1,
        cursor: isUnavailable ? "not-allowed" : "pointer",
      }}
    >
      <div
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
        {String(index + 1).padStart(2, "0")}
      </div>

      {product.imageUrl ? (
        <div className="relative w-full overflow-hidden" style={{ height: "140px" }}>
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
          style={{ height: "60px", backgroundColor: "var(--tg-surface-high)" }}
        >
          <span style={{ color: "var(--tg-primary)", fontSize: "20px" }}>◆</span>
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3
            className="text-sm uppercase leading-tight"
            style={{
              fontFamily: "var(--tg-font-display)",
              fontWeight: 700,
              color: "var(--tg-fg)",
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
        </div>
      </div>
    </button>
  );
}
