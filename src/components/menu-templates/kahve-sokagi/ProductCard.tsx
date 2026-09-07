"use client";

import { Loader2, Plus, UtensilsCrossed } from "lucide-react";
import { useState, type MouseEvent } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useMenuPriceDisplay } from "../shared/menu-currency";
import { useMenuLocaleOptional } from "../shared/menu-locale";
import { useOrderingOptional } from "../shared/ordering-context";

export type KahveProductCardLayout = "grid" | "wide" | "list";

type KahveProductCardProps = {
  product: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
  layout?: KahveProductCardLayout;
  className?: string;
};

function tagAt(product: MenuProductApiItem, index: number): string | null {
  const name = product.tags?.[index]?.name?.trim();
  return name || null;
}

function productSubtitle(product: MenuProductApiItem): string {
  return (
    tagAt(product, 1) ||
    product.subCategoryName?.trim() ||
    (product.chefRecommended ? "Şefin Seçimi" : "Özel Tarif")
  );
}

function productBadge(product: MenuProductApiItem): string | null {
  if (product.chefRecommended) return "Şefin Önerisi";
  return tagAt(product, 0);
}

function productFooterMeta(product: MenuProductApiItem, badge: string | null): string {
  const tags = (product.tags ?? []).map((tag) => tag.name.trim()).filter(Boolean);
  const unused = tags.find((name) => name !== badge);
  if (unused) return unused;
  if (product.chefRecommended) return "🧀 Şefin Özel Tercihi";
  return "🔥 Özel";
}

export function KahveProductCard({
  product,
  onOpen,
  layout = "grid",
  className,
}: KahveProductCardProps) {
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const price = useMenuPriceDisplay(product.price, product.currency);
  const [busy, setBusy] = useState(false);
  const unavailable = product.available === false;
  const canOrder = Boolean(ordering && !unavailable);
  const badge = productBadge(product);
  const subtitle = productSubtitle(product);
  const footerMeta = productFooterMeta(product, badge);
  const addLabel = locale?.t.addToCart ?? "Sepete Ekle";

  const handleAdd = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canOrder || !ordering) {
      onOpen(product);
      return;
    }
    setBusy(true);
    try {
      await ordering.beginAddProduct(product, 1);
    } finally {
      setBusy(false);
    }
  };

  if (layout === "list") {
    return (
      <article
        className={cn(
          "flex items-center justify-between rounded-2xl border border-[rgba(212,195,187,0.55)] bg-white p-3 shadow-sm transition hover:border-[rgba(162,63,0,0.4)]",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ffdbcd]/50 text-xl text-[#a23f00]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <UtensilsCrossed className="h-4 w-4 opacity-60" strokeWidth={1.75} />
            )}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-1 text-xs font-bold text-[#1b1c1a]">{product.name}</span>
            {product.description ? (
              <span className="mt-0.5 block line-clamp-1 text-[11px] text-[#50443e]">
                {product.description}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2.5 pl-2">
          {price ? (
            <span className="font-display text-sm font-extrabold text-[#311908]">{price}</span>
          ) : null}
          <button
            type="button"
            disabled={busy || Boolean(ordering?.loading)}
            onClick={(event) => void handleAdd(event)}
            aria-label={addLabel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eae8e4] text-[#311908] shadow-sm transition hover:bg-[#a23f00] hover:text-white active:scale-90 disabled:opacity-50"
          >
            {busy || ordering?.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </article>
    );
  }

  if (layout === "wide") {
    return (
      <article
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border border-[rgba(212,195,187,0.55)] bg-white p-3 shadow-sm transition hover:border-[rgba(162,63,0,0.5)]",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f3e6d8]"
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7ebe0] to-[#e8d5c4] text-[#a23f00]/40">
              <UtensilsCrossed className="h-8 w-8" strokeWidth={1.25} />
            </span>
          )}
          {badge ? (
            <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
              {badge}
            </span>
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onOpen(product)} className="w-full text-left">
            <div className="flex items-center justify-between gap-1">
              <h4 className="truncate text-xs font-bold text-[#1b1c1a]">{product.name}</h4>
              {price ? (
                <span className="ml-1 shrink-0 font-display text-sm font-extrabold text-[#311908]">
                  {price}
                </span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[#50443e]">{product.description}</p>
            ) : null}
          </button>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-semibold text-[#a23f00]">{footerMeta}</span>
            <button
              type="button"
              disabled={busy || Boolean(ordering?.loading)}
              onClick={(event) => void handleAdd(event)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#311908] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm active:scale-95 disabled:opacity-50"
            >
              {busy || ordering?.loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" strokeWidth={2.5} />
              )}
              Ekle
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-[rgba(212,195,187,0.55)] bg-white p-2.5 shadow-sm transition hover:border-[rgba(162,63,0,0.5)]",
        className,
      )}
    >
      <div className="flex flex-1 flex-col justify-between">
        <button type="button" onClick={() => onOpen(product)} className="w-full text-left">
          <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f3e6d8]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7ebe0] to-[#e8d5c4] text-[#a23f00]/40">
                <UtensilsCrossed className="h-10 w-10" strokeWidth={1.25} />
              </span>
            )}
            {badge ? (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-[#a23f00] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                {badge}
              </span>
            ) : null}
            {price ? (
              <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-[#311908]/85 px-2 py-0.5 font-display text-xs font-extrabold text-white shadow backdrop-blur-sm">
                {price}
              </span>
            ) : null}
          </div>
          <h4 className="line-clamp-1 text-xs font-bold leading-snug text-[#1b1c1a]">
            {product.name}
          </h4>
          <span className="mt-0.5 block text-[10px] font-semibold text-[#a23f00]">{subtitle}</span>
          {product.description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-[#50443e]">{product.description}</p>
          ) : null}
          {unavailable ? (
            <p className="mt-1 text-[10px] font-medium text-[#50443e]">
              {locale?.t.productUnavailable ?? "Mevcut değil"}
            </p>
          ) : null}
        </button>

        <div className="mt-2.5 flex items-center justify-between border-t border-[rgba(212,195,187,0.35)] pt-1.5">
          <span className="truncate pr-2 text-[10px] font-medium text-stone-500">{footerMeta}</span>
          <button
            type="button"
            disabled={busy || Boolean(ordering?.loading)}
            onClick={(event) => void handleAdd(event)}
            aria-label={addLabel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#a23f00]/10 text-[#a23f00] transition hover:bg-[#a23f00] hover:text-white active:scale-90 disabled:opacity-50"
          >
            {busy || ordering?.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
