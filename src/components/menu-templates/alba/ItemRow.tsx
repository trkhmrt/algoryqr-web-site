import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";

type ItemRowProps = {
  item: MenuProductApiItem;
  onOpen: (item: MenuProductApiItem) => void;
};

export function ItemRow({ item, onOpen }: ItemRowProps) {
  const price = formatMenuPrice(item.price, item.currency);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-stretch gap-4 border-b border-[var(--ab-border)] py-4 text-left transition first:pt-0 last:border-0 hover:bg-[color-mix(in_srgb,var(--ab-surface)_70%,transparent)]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--ab-bg-soft)]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl ab-accent">
            ◇
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight ab-fg">
            {item.name}
          </h3>
          {price ? (
            <span className="shrink-0 text-sm font-medium ab-accent">{price}</span>
          ) : null}
        </div>
        {item.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed ab-muted">
            {item.description}
          </p>
        ) : null}
        {!item.available ? (
          <span className="mt-1 w-fit rounded-md bg-[var(--ab-destructive-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ab-destructive">
            Tükendi
          </span>
        ) : null}
      </div>
    </button>
  );
}
