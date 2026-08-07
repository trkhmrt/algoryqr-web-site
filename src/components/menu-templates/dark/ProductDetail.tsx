"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import {
  DenseMetaChips,
  DenseNutritionStrip,
  formatServesPeopleLabel,
} from "../shared";

type DarkProductDetailProps = {
  product: MenuProductApiItem;
  onBack: () => void;
};

export function DarkProductDetail({ product, onBack }: DarkProductDetailProps) {
  const price = formatMenuPrice(product.price, product.currency);
  const servesLabel = formatServesPeopleLabel(product.servesPeopleMin, product.servesPeopleMax);

  return (
    <div className="px-4 pb-20 pt-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-sm text-neutral-400 hover:text-neutral-100"
      >
        ← Menüye dön
      </button>

      {product.imageUrl ? (
        <div className="mb-4 h-44 overflow-hidden rounded-xl">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <DenseMetaChips
        product={product}
        maxAllergens={4}
        maxTags={3}
        chipClassName="bg-neutral-800 text-neutral-400"
        accentChipClassName="bg-emerald-500/20 text-emerald-300"
        destructiveChipClassName="bg-red-500/20 text-red-300"
      />

      <div className="mb-2 mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-bold">{product.name}</h2>
        {price ? (
          <span className="shrink-0 text-xl font-semibold text-emerald-400">
            {price}
          </span>
        ) : null}
      </div>
      {servesLabel ? (
        <p className="mb-3 text-sm text-neutral-400">{servesLabel}</p>
      ) : null}

      {product.description ? (
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          {product.description}
        </p>
      ) : null}

      <DenseNutritionStrip
        nutrition={product.nutrition}
        itemClassName="bg-neutral-900 ring-1 ring-neutral-800"
        labelClassName="text-neutral-500"
        valueClassName="text-emerald-300"
      />
    </div>
  );
}
