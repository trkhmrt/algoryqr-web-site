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
      className="flex w-full gap-3 rounded-[1.15rem] border border-white/80 bg-white/75 p-2.5 text-left shadow-[0_8px_24px_rgba(28,40,36,0.05)] backdrop-blur-sm transition hover:bg-white hover:shadow-[0_12px_28px_rgba(28,40,36,0.08)] active:scale-[0.99]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[0.9rem] bg-[#e8ebe9]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8a9a93]">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#1c2824]">
          {item.name}
        </p>
        {item.subCategoryName || item.mainCategoryName ? (
          <p className="mt-0.5 truncate text-xs text-[#6b7a73]">
            {[item.mainCategoryName, item.subCategoryName].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        {priceLabel ? (
          <p className="mt-1 text-sm font-medium text-[#3d5a4c]">{priceLabel}</p>
        ) : null}
      </div>
    </button>
  );
}
