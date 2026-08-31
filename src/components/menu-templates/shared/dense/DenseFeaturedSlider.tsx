"use client";

import { ImageIcon } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useMenuPriceDisplay } from "../menu-currency";
import { DenseMetaChips } from "./DenseMetaChips";

type DenseFeaturedSliderProps = {
  items: MenuProductApiItem[];
  onOpen: (item: MenuProductApiItem) => void;
  className?: string;
  cardClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  priceClassName?: string;
  chipClassName?: string;
  accentChipClassName?: string;
  destructiveChipClassName?: string;
  imagePlaceholderClassName?: string;
};

type DenseFeaturedSliderCardProps = Omit<DenseFeaturedSliderProps, "items"> & {
  item: MenuProductApiItem;
};

function DenseFeaturedSliderCard({
  item,
  onOpen,
  cardClassName,
  imageClassName,
  titleClassName,
  priceClassName,
  chipClassName,
  accentChipClassName,
  destructiveChipClassName,
  imagePlaceholderClassName,
}: DenseFeaturedSliderCardProps) {
  const price = useMenuPriceDisplay(item.price, item.currency);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "w-40 shrink-0 snap-start overflow-hidden rounded-2xl border text-left transition active:scale-[0.98]",
        cardClassName,
      )}
    >
      <div className={cn("relative h-28 w-full overflow-hidden", imageClassName)}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              imagePlaceholderClassName,
            )}
          >
            <ImageIcon className="h-5 w-5 opacity-40" />
          </div>
        )}
        {price ? (
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm",
              priceClassName,
            )}
          >
            {price}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-2.5">
        <h3 className={cn("line-clamp-2 text-sm font-semibold leading-tight", titleClassName)}>
          {item.name}
        </h3>
        <DenseMetaChips
          product={item}
          maxAllergens={1}
          maxTags={1}
          chipClassName={chipClassName}
          accentChipClassName={accentChipClassName}
          destructiveChipClassName={destructiveChipClassName}
        />
      </div>
    </button>
  );
}

export function DenseFeaturedSlider({
  items,
  onOpen,
  className,
  cardClassName,
  imageClassName,
  titleClassName,
  priceClassName,
  chipClassName,
  accentChipClassName,
  destructiveChipClassName,
  imagePlaceholderClassName,
}: DenseFeaturedSliderProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1",
        className,
      )}
    >
      {items.map((item) => (
        <DenseFeaturedSliderCard
          key={item.productId}
          item={item}
          onOpen={onOpen}
          cardClassName={cardClassName}
          imageClassName={imageClassName}
          titleClassName={titleClassName}
          priceClassName={priceClassName}
          chipClassName={chipClassName}
          accentChipClassName={accentChipClassName}
          destructiveChipClassName={destructiveChipClassName}
          imagePlaceholderClassName={imagePlaceholderClassName}
        />
      ))}
    </div>
  );
}
