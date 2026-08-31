"use client";

import { useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import { resolveProductNavCategory } from "../types";
import { DenseNutritionStrip } from "../shared/dense";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";
import { formatMaisonPrice, getBreadcrumbs } from "./category-utils";
import { maisonNoirCategoryMark } from "./styles";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  categories: TaxonomyNavNode[];
  onBack: () => void;
  onHome: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
};

export function MaisonNoirProductDetailView({
  product,
  categories,
  onBack,
  onHome,
  onSelectCategory,
}: ProductDetailViewProps) {
  const price = formatMaisonPrice(product.price);
  const leafCategory = resolveProductNavCategory(categories, product);
  const crumbs = leafCategory != null ? getBreadcrumbs(categories, leafCategory.categoryId) : [];
  const sectionLabel = leafCategory?.name ?? product.mainCategoryName ?? product.subCategoryName;
  const sectionMark =
    leafCategory != null
      ? maisonNoirCategoryMark(
          Math.max(
            0,
            categories.findIndex((c) => c.categoryId === crumbs[0]?.categoryId),
          ),
        )
      : null;
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const tags = product.tags ?? [];
  const allergens = product.allergens ?? [];

  return (
    <div className="min-h-[60vh] pb-8">
      <div className="relative">
        <div className="h-[58vh] w-full overflow-hidden bg-[var(--mn-surface)]">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-5xl text-[var(--mn-primary)]/30">
              ◆
            </div>
          )}
        </div>
        <div className="mn-veil absolute inset-0" />
        <button
          type="button"
          onClick={onBack}
          className="mn-type-eyebrow absolute left-5 top-6 text-[var(--mn-fg)] transition-colors hover:text-[var(--mn-primary)] sm:left-7"
        >
          ← Menü
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 text-center sm:px-7">
          {sectionLabel ? (
            <p className="mn-type-eyebrow text-[var(--mn-primary)]">
              {sectionLabel}
              {sectionMark ? ` · ${sectionMark}` : ""}
            </p>
          ) : null}
          <h1 className="mt-2 mn-type-page-title text-[var(--mn-fg)]">
            {product.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 sm:px-7">
        {crumbs.length > 0 ? (
          <nav className="flex flex-wrap items-center justify-center gap-2 border-b border-[var(--mn-border)] py-3 mn-type-label text-[var(--mn-muted)]">
            <button
              type="button"
              onClick={onHome}
              className="hover:text-[var(--mn-primary)]"
            >
              Menü
            </button>
            {crumbs.map((crumb) => (
              <span key={crumb.categoryId} className="inline-flex items-center gap-2">
                <span aria-hidden>·</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory(crumb)}
                  className="hover:text-[var(--mn-primary)]"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        ) : null}

        <div className="flex items-baseline justify-between border-b border-[var(--mn-border)] py-4">
          <span className="mn-type-eyebrow text-[var(--mn-muted)]">Fiyat</span>
          {price ? (
            <span className="mn-type-body-strong text-[var(--mn-primary)]">{price}</span>
          ) : null}
        </div>

        {product.description ? (
          <p className="mt-6 mn-type-body-strong italic text-[var(--mn-fg)]">
            {product.description}
          </p>
        ) : null}

        {tags.length > 0 ? (
          <section className="mt-12">
            <h2 className="mn-tracked text-[0.55rem] text-[var(--mn-primary)]">Kompozisyon</h2>
            <ul className="mt-5 space-y-3">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center gap-4 text-sm text-[var(--mn-muted)]"
                >
                  <span className="h-px w-6 bg-[var(--mn-primary)]/60" />
                  {tag.name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(sectionLabel || product.chefRecommended) && (
          <div className="mt-12 grid grid-cols-2 gap-px bg-[var(--mn-border)]">
            {sectionLabel ? (
              <div className="bg-[var(--mn-bg)] p-6">
                <h2 className="mn-tracked text-[0.5rem] text-[var(--mn-muted)]">Kategori</h2>
                <p className="mt-3 font-display text-lg leading-snug text-[var(--mn-fg)]">
                  {sectionLabel}
                </p>
              </div>
            ) : null}
            {product.chefRecommended ? (
              <div className="bg-[var(--mn-bg)] p-6">
                <h2 className="mn-tracked text-[0.5rem] text-[var(--mn-muted)]">Seçki</h2>
                <p className="mt-3 font-display text-lg leading-snug text-[var(--mn-fg)]">
                  Şef önerisi
                </p>
              </div>
            ) : (
              <div className="bg-[var(--mn-bg)] p-6">
                <h2 className="mn-tracked text-[0.5rem] text-[var(--mn-muted)]">Servis</h2>
                <p className="mt-3 font-display text-lg leading-snug text-[var(--mn-fg)]">
                  {[product.servesPeopleMin, product.servesPeopleMax]
                    .filter((v) => v != null)
                    .join("–") || "Tek porsiyon"}
                </p>
              </div>
            )}
          </div>
        )}

        {product.nutrition ? (
          <div className="mt-10">
            <DenseNutritionStrip nutrition={product.nutrition} />
          </div>
        ) : null}

        {allergens.length > 0 ? (
          <section className="mt-12">
            <h2 className="mn-tracked text-[0.55rem] text-[var(--mn-muted)]">Alerjenler</h2>
            <p className="mt-4 text-sm text-[var(--mn-muted)]">
              {allergens.map((a) => a.name).join(" · ")}
            </p>
          </section>
        ) : null}

        {ordering && !unavailable ? (
          <button
            type="button"
            disabled={busy || ordering.loading}
            onClick={async () => {
              setBusy(true);
              try {
                await ordering.addProduct(product, 1);
                ordering.setCartOpen(true);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-12 block w-full border border-[var(--mn-primary)]/60 py-5 transition-colors duration-500 hover:bg-[var(--mn-primary)] hover:text-[var(--mn-primary-fg)] disabled:opacity-50"
          >
            <span className="mn-tracked text-[0.62rem]">
              {busy ? "…" : (locale?.t.addToOrder ?? "Siparişe Ekle")}
            </span>
          </button>
        ) : null}

        {unavailable ? (
          <p className="mt-10 text-center text-sm text-[var(--mn-muted)]">
            Bu ürün şu an mevcut değil.
          </p>
        ) : null}

        <div className="mn-hairline mt-16" />
        <p className="mt-6 text-center text-[0.6rem] tracking-[0.25em] text-[var(--mn-muted)]/80">
          ŞEFİN ÖNERİSİ ÜZERİNE UYARLAMA YAPILABİLİR
        </p>
      </div>
    </div>
  );
}
