"use client";

import { ImageIcon } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMenuPrice } from "../types";
import { DenseMetaChips, DenseNutritionStrip, MenuRatingControl } from "../shared";
import { SoftProductRecommendations } from "./ProductRecommendations";

type ProductDetailSheetProps = {
  product: MenuProductApiItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProduct?: (product: MenuProductApiItem) => void;
  menuRating?: {
    ratingAvg: number | null;
    ratingCount: number;
    userRating?: number | null;
  };
};

export function SoftProductDetailSheet({
  product,
  open,
  onOpenChange,
  onOpenProduct,
  menuRating,
}: ProductDetailSheetProps) {
  const price = product
    ? formatMenuPrice(product.price, product.currency)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="soft-menu max-h-[92vh] overflow-y-auto rounded-t-3xl border-[var(--sf-border)] bg-[var(--sf-surface)] p-0"
      >
        {product ? (
          <>
            <div className="relative h-40 w-full overflow-hidden bg-[var(--sf-bg-soft)]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center sf-muted">
                  <ImageIcon className="h-10 w-10 opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-surface)] via-transparent to-transparent" />
            </div>

            <div className="relative -mt-6 space-y-4 px-4 pb-8">
              <SheetHeader className="space-y-2 text-left">
                <DenseMetaChips
                  product={product}
                  maxAllergens={4}
                  maxTags={3}
                  chipClassName="bg-[var(--sf-bg-soft)] sf-muted"
                  accentChipClassName="bg-[var(--sf-accent-soft)] sf-fg"
                  destructiveChipClassName="bg-[var(--sf-destructive-soft)] sf-destructive"
                />
                <SheetTitle className="font-display text-xl font-bold leading-tight sf-fg">
                  {product.name}
                </SheetTitle>
                <div className="flex items-end justify-between gap-3">
                  <SheetDescription className="sr-only">
                    Ürün detayı
                  </SheetDescription>
                  {price ? (
                    <p className="font-display text-xl font-bold sf-fg">{price}</p>
                  ) : null}
                </div>
                {menuRating ? (
                  <MenuRatingControl
                    ratingAvg={menuRating.ratingAvg}
                    ratingCount={menuRating.ratingCount}
                    userRating={menuRating.userRating}
                    readonly
                  />
                ) : null}
              </SheetHeader>

              <DenseNutritionStrip
                nutrition={product.nutrition}
                itemClassName="border border-[var(--sf-border)] bg-[var(--sf-bg)]"
                labelClassName="sf-muted"
                valueClassName="sf-fg"
              />

              {product.description ? (
                <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] sf-muted">
                    Açıklama
                  </p>
                  <p className="text-sm leading-relaxed sf-fg">{product.description}</p>
                </div>
              ) : null}

              <SoftProductRecommendations
                menuId={product.menuId}
                productId={product.productId}
                onOpenProduct={onOpenProduct}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
