import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import { DenseMetaChips, DenseNutritionStrip } from "../shared";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  onBack: () => void;
};

export function GlassyGrayProductDetailView({ product, onBack }: ProductDetailViewProps) {
  const price = formatMenuPrice(product.price, product.currency);

  return (
    <div>
      <div className="relative mb-4 h-44 overflow-hidden rounded-2xl">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="gg-placeholder flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {price ? (
          <span className="gg-display gg-primary absolute right-3 top-3 rounded-xl bg-black/50 px-3 py-1.5 text-lg font-bold backdrop-blur">
            {price}
          </span>
        ) : null}
      </div>

      <div className="gg-glass rounded-2xl p-4">
        <DenseMetaChips
          product={product}
          maxAllergens={4}
          maxTags={3}
          chipClassName="bg-white/10 gg-muted"
          accentChipClassName="bg-[var(--gg-primary)] text-[#1a120e]"
          destructiveChipClassName="bg-red-500/20 text-red-300"
        />
        <h2 className="gg-display mt-2 text-2xl font-bold text-white">{product.name}</h2>

        {product.description ? (
          <p className="gg-muted mt-3 text-sm leading-relaxed">{product.description}</p>
        ) : null}

        <div className="mt-4">
          <DenseNutritionStrip
            nutrition={product.nutrition}
            itemClassName="border border-white/10 bg-black/20"
            labelClassName="gg-muted"
            valueClassName="gg-primary"
          />
        </div>

        <button
          type="button"
          onClick={onBack}
          className="gg-cta gg-display mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold active:scale-95"
        >
          <span className="material-symbols-outlined">restaurant_menu</span>
          Menüye Dön
        </button>
      </div>
    </div>
  );
}
