import { ImageIcon } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatMenuPrice } from "../types";

type ProductCardProps = {
  item: MenuProductApiItem;
  onOpen: (item: MenuProductApiItem) => void;
};

export function SoftProductCard({ item, onOpen }: ProductCardProps) {
  const price = formatMenuPrice(item.price, item.currency);
  const popular = Boolean(item.imageUrl) && item.available !== false;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-2.5 text-left shadow-sm transition duration-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--sf-bg-soft)] sm:h-24 sm:w-24">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center sf-muted">
            <ImageIcon className="h-5 w-5 opacity-40" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5 pr-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] font-semibold leading-snug sf-fg">
            {item.name}
          </h3>
          {price ? (
            <span className="shrink-0 text-sm font-semibold sf-fg">{price}</span>
          ) : null}
        </div>
        {item.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed sf-muted">
            {item.description}
          </p>
        ) : null}
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {!item.available ? (
            <Badge className="rounded-full border-0 bg-[var(--sf-destructive-soft)] px-2 py-0 text-[10px] font-medium sf-destructive hover:bg-[var(--sf-destructive-soft)]">
              Tükendi
            </Badge>
          ) : popular ? (
            <Badge className="rounded-full border-0 bg-[var(--sf-accent-soft)] px-2 py-0 text-[10px] font-medium sf-fg hover:bg-[var(--sf-accent-soft)]">
              Popüler
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}
