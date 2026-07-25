"use client";

import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import { MenuNutritionFacts } from "../shared";

type DarkProductDetailProps = {
  product: MenuProductApiItem;
  onBack: () => void;
};

export function DarkProductDetail({ product, onBack }: DarkProductDetailProps) {
  const price = formatMenuPrice(product.price, product.currency);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-neutral-400 hover:text-neutral-100"
      >
        ← Menüye dön
      </button>

      {product.imageUrl ? (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-3xl font-bold">{product.name}</h2>
        {price ? (
          <span className="shrink-0 text-xl font-semibold text-emerald-400">
            {price}
          </span>
        ) : null}
      </div>

      {!product.available ? (
        <span className="mb-4 inline-block rounded-md bg-neutral-800 px-2 py-1 text-xs font-semibold uppercase text-neutral-300">
          Tükendi
        </span>
      ) : null}

      {product.description ? (
        <p className="mb-8 text-base leading-relaxed text-neutral-300">
          {product.description}
        </p>
      ) : null}

      <MenuNutritionFacts
        nutrition={product.nutrition}
        className="rounded-xl bg-neutral-900 p-5 ring-1 ring-neutral-800"
        titleClassName="text-neutral-100"
        basisClassName="text-neutral-500"
        rowClassName="border-neutral-800"
        labelClassName="text-neutral-400"
        valueClassName="text-emerald-300"
        footnoteClassName="text-neutral-500"
      />
    </div>
  );
}
