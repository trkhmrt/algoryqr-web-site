"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Plus } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useMenuPriceDisplay } from "../menu-currency";
import { useOrderingOptional } from "../ordering-context";
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
  const ordering = useOrderingOptional();
  const price = useMenuPriceDisplay(item.price, item.currency);
  const isCard = variant === "card";
  const isUnavailable = item.available === false;
  const canAdd = ordering && !isUnavailable;

  if (isCard) {
    return (
      <article
        className={cn(
          "group flex flex-col border",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="flex flex-col text-left"
        >
          <div
            className={cn(
              "relative w-full shrink-0 overflow-hidden",
              imageClassName ?? "h-44",
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
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 pt-3">
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
        {canAdd ? (
          <div className="flex justify-end px-3 pb-3 pt-2">
            <DenseAddButton ordering={ordering} item={item} />
          </div>
        ) : (
          <div className="pb-3" />
        )}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex w-full items-stretch gap-2.5 border-b py-3 last:border-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="flex min-w-0 flex-1 items-stretch gap-2.5 text-left transition active:scale-[0.995]"
      >
        <div
          className={cn(
            "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl",
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
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
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
      {canAdd ? (
        <div className="flex shrink-0 items-center">
          <DenseAddButton ordering={ordering} item={item} />
        </div>
      ) : null}
    </article>
  );
}

function DenseAddButton({
  ordering,
  item,
}: {
  ordering: NonNullable<ReturnType<typeof useOrderingOptional>>;
  item: MenuProductApiItem;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy || ordering.loading}
      onClick={async () => {
        setBusy(true);
        try {
          await ordering.addProduct(item, 1);
        } finally {
          setBusy(false);
        }
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-foreground text-background transition-opacity disabled:opacity-50"
      aria-label="Sepete ekle"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
    </button>
  );
}
