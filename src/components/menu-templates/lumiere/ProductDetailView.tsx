import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import { DenseMetaChips, DenseNutritionStrip } from "../shared";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
};

export function LumiereProductDetailView({ product }: ProductDetailViewProps) {
  const price = formatMenuPrice(product.price, product.currency);

  return (
    <div>
      <section className="relative h-44 w-full overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="lm-placeholder flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </section>

      <section className="px-4 py-4">
        <DenseMetaChips
          product={product}
          maxAllergens={4}
          maxTags={3}
          chipClassName="bg-[var(--lm-surface-container)] text-[var(--lm-on-surface-variant)]"
          accentChipClassName="bg-[var(--lm-primary)] text-white"
          destructiveChipClassName="bg-[var(--lm-primary-container)] text-white"
        />
        <h2 className="lm-headline-lg mt-2 text-[var(--lm-on-surface)]">{product.name}</h2>
        {price ? (
          <p className="lm-headline-md mt-1 text-[var(--lm-primary)]">{price}</p>
        ) : null}

        {product.description ? (
          <p className="lm-body-lg mt-3 leading-relaxed text-[var(--lm-on-surface)]">
            {product.description}
          </p>
        ) : null}

        <div className="mt-4">
          <DenseNutritionStrip
            nutrition={product.nutrition}
            itemClassName="border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-highest)]"
            labelClassName="text-[var(--lm-on-surface-variant)]"
            valueClassName="text-[var(--lm-on-surface)]"
          />
        </div>
      </section>
    </div>
  );
}
