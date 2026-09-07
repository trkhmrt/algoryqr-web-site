"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { resolveProductNavCategory } from "../types";
import { useMenuPriceDisplay } from "../shared/menu-currency";
import { DenseNutritionStrip } from "../shared/dense";
import { useOrderingOptional } from "../shared/ordering-context";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { getBreadcrumbs } from "./category-utils";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function TechGourmetProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
}: ProductDetailViewProps) {
  const price = useMenuPriceDisplay(product.price, product.currency);
  const leafCategory = resolveProductNavCategory(categories, product);
  const crumbs = leafCategory != null ? getBreadcrumbs(categories, leafCategory.categoryId) : [];
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const [busy, setBusy] = useState(false);

  const isUnavailable = product.available === false;

  return (
    <div className="pb-20">
      {/* Product Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "60vw", maxHeight: "400px", backgroundColor: "var(--tg-surface-container)" }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            style={{ filter: "grayscale(20%) contrast(1.1)" }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ fontSize: "64px", color: "var(--tg-primary)" }}
          >
            ◆
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 50%, var(--tg-bg) 100%)" }}
        />
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 flex items-center gap-1.5 px-3 py-1.5 transition-colors"
          style={{
            backgroundColor: "var(--tg-bg)",
            border: "1px solid var(--tg-outline-variant)",
            fontFamily: "var(--tg-font-mono)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "var(--tg-fg-variant)",
          }}
        >
          <ArrowLeft size={12} />
          GERİ
        </button>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        {/* Breadcrumb */}
        <nav
          className="mt-4 mb-3 flex flex-wrap items-center gap-1"
          style={{ fontFamily: "var(--tg-font-mono)", fontSize: "10px", letterSpacing: "0.1em", color: "var(--tg-fg-variant)" }}
        >
          <button type="button" onClick={onHome} className="uppercase hover:underline">
            Menü
          </button>
          {crumbs.map((c, i) => (
            <span key={c.categoryId} className="flex items-center gap-1">
              <ChevronRight size={10} />
              {i === crumbs.length - 1 ? (
                <span style={{ color: "var(--tg-fg)" }}>{c.name.toUpperCase()}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectCategory(c)}
                  className="uppercase hover:underline"
                >
                  {c.name.toUpperCase()}
                </button>
              )}
            </span>
          ))}
        </nav>

        {/* Title + Price */}
        <div
          className="flex items-start justify-between pb-4"
          style={{ borderBottom: "1px solid var(--tg-outline-variant)" }}
        >
          <div className="flex-1 pr-4">
            <h1
              className="text-2xl uppercase leading-tight sm:text-3xl"
              style={{
                fontFamily: "var(--tg-font-display)",
                fontWeight: 800,
                color: "var(--tg-fg)",
                letterSpacing: "-0.03em",
              }}
            >
              {product.name}
            </h1>
            {product.description ? (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tg-fg-variant)" }}>
                {product.description}
              </p>
            ) : null}
          </div>
          {price ? (
            <div className="flex-shrink-0 text-right">
              <span
                className="block text-2xl"
                style={{
                  fontFamily: "var(--tg-font-display)",
                  fontWeight: 700,
                  color: "var(--tg-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {price}
              </span>
              <span
                className="mt-0.5 block text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.06em" }}
              >
                BAZA_FİYAT
              </span>
            </div>
          ) : null}
        </div>

        {/* Bento Info Grid */}
        <div
          className="mt-px grid grid-cols-2 gap-px"
          style={{ background: "var(--tg-outline-variant)" }}
        >
          {/* Nutrition cells if available */}
          {product.nutrition?.energyKcal != null && (
            <div
              className="flex flex-col justify-between p-4"
              style={{ backgroundColor: "var(--tg-surface-container)" }}
            >
              <span
                className="mb-3 block text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.08em" }}
              >
                ENERJİ_DEĞERİ
              </span>
              <div className="flex items-end justify-between">
                <span
                  className="text-3xl leading-none"
                  style={{ fontFamily: "var(--tg-font-display)", fontWeight: 700, color: "var(--tg-fg)" }}
                >
                  {product.nutrition.energyKcal}
                </span>
                <span
                  className="mb-0.5 text-xs"
                  style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)", letterSpacing: "0.06em" }}
                >
                  KCAL
                </span>
              </div>
            </div>
          )}

          {product.nutrition?.protein != null && (
            <div
              className="flex flex-col justify-between p-4"
              style={{ backgroundColor: "var(--tg-surface-container)" }}
            >
              <span
                className="mb-3 block text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.08em" }}
              >
                PROTEİN
              </span>
              <div className="flex items-end justify-between">
                <span
                  className="text-3xl leading-none"
                  style={{ fontFamily: "var(--tg-font-display)", fontWeight: 700, color: "var(--tg-fg)" }}
                >
                  {product.nutrition.protein}
                </span>
                <span
                  className="mb-0.5 text-xs"
                  style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-primary)", letterSpacing: "0.06em" }}
                >
                  GRAM
                </span>
              </div>
            </div>
          )}

          {/* Tags/Allergens */}
          {(product.tags?.length ?? 0) > 0 && (
            <div
              className="col-span-2 p-4"
              style={{ backgroundColor: "var(--tg-surface-container)" }}
            >
              <span
                className="mb-3 block text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.08em" }}
              >
                ETİKETLER
              </span>
              <div className="flex flex-wrap gap-2">
                {product.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs"
                    style={{
                      border: "1px solid var(--tg-outline-variant)",
                      fontFamily: "var(--tg-font-mono)",
                      color: "var(--tg-fg-variant)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {tag.name.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {(product.allergens?.length ?? 0) > 0 && (
            <div
              className="col-span-2 p-4"
              style={{ backgroundColor: "var(--tg-surface-container)" }}
            >
              <span
                className="mb-3 block text-xs uppercase"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-fg-variant)", letterSpacing: "0.08em" }}
              >
                ALERJENLER
              </span>
              <div className="flex flex-wrap gap-2">
                {product.allergens?.map((allergen) => (
                  <span
                    key={allergen.id}
                    className="px-2 py-0.5 text-xs"
                    style={{
                      border: "1px solid var(--tg-destructive)",
                      fontFamily: "var(--tg-font-mono)",
                      color: "var(--tg-destructive)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {allergen.name.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full nutrition strip */}
        {product.nutrition && (
          <div className="mt-px">
            <DenseNutritionStrip
              nutrition={product.nutrition}
              itemClassName="border border-[var(--tg-outline-variant)] bg-[var(--tg-surface-container)]"
              labelClassName="tg-muted"
              valueClassName="tg-fg"
            />
          </div>
        )}

        {/* Category link */}
        {leafCategory ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onSelectCategory(leafCategory)}
              className="flex items-center gap-2 text-xs uppercase transition-colors hover:underline"
              style={{
                fontFamily: "var(--tg-font-mono)",
                color: "var(--tg-fg-variant)",
                letterSpacing: "0.06em",
              }}
            >
              {leafCategory.name.toUpperCase()} kategorisine dön
              <ChevronRight size={12} />
            </button>
          </div>
        ) : null}

        {/* Add to order CTA */}
        {ordering && !isUnavailable ? (
          <div className="mt-6">
            <button
              type="button"
              disabled={busy || ordering.loading}
              onClick={async () => {
                setBusy(true);
                try {
                  await ordering.beginAddProduct(product, 1);
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full py-4 text-base uppercase tracking-widest transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "var(--tg-primary)",
                color: "var(--tg-on-primary)",
                fontFamily: "var(--tg-font-display)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                border: "1px solid var(--tg-primary)",
              }}
            >
              + {locale?.t.addToOrder || "SİPARİŞE EKLE"}
            </button>
            {ordering.error ? (
              <p
                className="mt-2 text-xs"
                style={{ fontFamily: "var(--tg-font-mono)", color: "var(--tg-destructive)" }}
              >
                {ordering.error}
              </p>
            ) : null}
          </div>
        ) : null}

        {isUnavailable && (
          <div
            className="mt-6 py-4 text-center text-sm uppercase tracking-widest"
            style={{
              border: "1px solid var(--tg-outline-variant)",
              fontFamily: "var(--tg-font-mono)",
              color: "var(--tg-fg-variant)",
            }}
          >
            MEVCUT DEĞİL
          </div>
        )}
      </main>
    </div>
  );
}
