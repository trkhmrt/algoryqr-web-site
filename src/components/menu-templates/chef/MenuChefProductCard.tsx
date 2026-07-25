"use client";

import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import { formatMenuPrice } from "../types";
import {
  chefItemToMenuProduct,
  useMenuProductNavigatorOptional,
} from "../shared";

type MenuChefProductCardProps = {
  item: ChefProductItem;
  onOpened?: () => void;
};

export function MenuChefProductCard({ item, onOpened }: MenuChefProductCardProps) {
  const navigator = useMenuProductNavigatorOptional();
  const priceLabel = formatMenuPrice(item.price ?? undefined, item.currency || "TRY");

  return (
    <button
      type="button"
      onClick={() => {
        navigator?.openProduct(chefItemToMenuProduct(item));
        onOpened?.();
      }}
      className="flex w-full gap-3 rounded-2xl border border-black/8 bg-white p-2.5 text-left shadow-sm transition hover:border-black/15 hover:shadow-md active:scale-[0.99]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
        {item.category ? (
          <p className="mt-0.5 truncate text-xs text-neutral-500">{item.category}</p>
        ) : null}
        {priceLabel ? (
          <p className="mt-1 text-sm font-medium text-amber-800">{priceLabel}</p>
        ) : null}
      </div>
    </button>
  );
}
