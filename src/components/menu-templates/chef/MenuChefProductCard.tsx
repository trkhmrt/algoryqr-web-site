"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { ChefProductItem } from "@/lib/chef/parse-chef-query";
import { formatMenuPrice } from "../types";
import {
  chefItemToMenuProduct,
  useMenuLocaleOptional,
  useMenuProductNavigatorOptional,
  useOrderingOptional,
} from "../shared";

import { MenuChefProductActionSheet } from "./MenuChefProductActionSheet";

type MenuChefProductCardProps = {
  item: ChefProductItem;
  onOpened?: () => void;
};

export function MenuChefProductCard({ item, onOpened }: MenuChefProductCardProps) {
  const navigator = useMenuProductNavigatorOptional();
  const ordering = useOrderingOptional();
  const locale = useMenuLocaleOptional();
  const priceLabel = formatMenuPrice(item.price ?? undefined, item.currency || "TRY");
  const [actionOpen, setActionOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);

  const canAddToOrder = Boolean(ordering) && item.available !== false;
  const addLabel = locale?.t.addToOrder || "Siparişe ekle";

  const openProductDetail = () => {
    navigator?.openProduct(chefItemToMenuProduct(item));
    onOpened?.();
  };

  const handleAddToOrder = async () => {
    if (!ordering || item.available === false) return;
    setAddBusy(true);
    try {
      await ordering.addProduct(chefItemToMenuProduct(item), 1);
      ordering.setCartOpen(true);
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <div className="flex w-[8.75rem] shrink-0 snap-start flex-col overflow-hidden rounded-[1.05rem] border border-white/80 bg-white/75 shadow-[0_8px_24px_rgba(28,40,36,0.05)] backdrop-blur-sm">
      <Popover open={actionOpen} onOpenChange={setActionOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full flex-col text-left transition hover:bg-white active:scale-[0.98]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#e8ebe9]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8a9a93]">
                  —
                </div>
              )}
            </div>
            <div className="flex min-h-[3.2rem] flex-col justify-between gap-1 px-2.5 pb-1.5 pt-2">
              <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug tracking-[-0.01em] text-[#1c2824]">
                {item.name}
              </p>
              {priceLabel ? (
                <p className="text-[12px] font-medium text-[#3d5a4c]">{priceLabel}</p>
              ) : null}
            </div>
          </button>
        </PopoverTrigger>
        <MenuChefProductActionSheet
          productName={item.name}
          onClose={() => setActionOpen(false)}
          onProductDetail={openProductDetail}
          {...(canAddToOrder && ordering
            ? {
                onAddToOrder: handleAddToOrder,
                addToOrderLabel: addLabel,
                addBusy: addBusy || ordering.loading,
              }
            : {})}
        />
      </Popover>
      {canAddToOrder && ordering ? (
        <div className="px-2 pb-2">
          <button
            type="button"
            disabled={addBusy || ordering.loading}
            onClick={(event) => {
              event.stopPropagation();
              void handleAddToOrder();
            }}
            className="inline-flex w-full items-center justify-center gap-1 rounded-[0.65rem] bg-[#1c2824] px-2 py-1.5 text-[11px] font-medium leading-none tracking-[-0.01em] text-white transition hover:bg-[#2a3833] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addBusy || ordering.loading ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.25} />
            ) : (
              <Plus className="h-3 w-3" strokeWidth={2.25} />
            )}
            {addLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
