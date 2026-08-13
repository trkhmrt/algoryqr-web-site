"use client";

import { ImageIcon } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import { cn } from "@/lib/utils";

import { formatMenuPrice } from "../../types";
import { DenseMetaChips } from "./DenseMetaChips";

type DenseProductRowProps = {
  item: MenuProductApiItem;
  onOpen: (item: MenuProductApiItem) => void;
  variant?: "row" | "card";
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  priceClassName?: string;
  descriptionClassName?: string;
  chipClassName?: string;
  accentChipClassName?: string;
  destructiveChipClassName?: string;
  imagePlaceholderClassName?: string;
};

export function DenseProductRow({
  item,
  onOpen,
  variant = "row",
  className,
  imageClassName,
  titleClassName,
  priceClassName,
  descriptionClassName,
  chipClassName,
  accentChipClassName,
  destructiveChipClassName,
  imagePlaceholderClassName,
}: DenseProductRowProps) {
  const price = formatMenuPrice(item.price, item.currency);
  const isCard = variant === "card";

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "group flex w-full text-left transition active:scale-[0.995]",
        isCard
          ? "flex-col gap-3 border p-0"
          : "items-stretch gap-2.5 border-b py-3 last:border-0",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          isCard ? "h-44 w-full" : "h-16 w-16 rounded-xl",
          imageClassName,
        )}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              imagePlaceholderClassName,
            )}
          >
            <ImageIcon className="h-4 w-4 opacity-40" />
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center gap-0.5",
          isCard && "px-3 pb-3",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("text-[15px] font-semibold leading-tight", titleClassName)}>
            {item.name}
          </h3>
          {price ? (
            <span className={cn("shrink-0 text-sm font-semibold", priceClassName)}>
              {price}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className={cn("line-clamp-1 text-xs leading-relaxed", descriptionClassName)}>
            {item.description}
          </p>
        ) : null}
        <DenseMetaChips
          product={item}
          chipClassName={chipClassName}
          accentChipClassName={accentChipClassName}
          destructiveChipClassName={destructiveChipClassName}
        />
      </div>
    </button>
  );
}
