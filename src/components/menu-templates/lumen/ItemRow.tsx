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
      className="group flex w-full items-stretch gap-4 rounded-2xl border border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)] p-3 text-left transition hover:border-[color-mix(in_oklch,var(--ln-gold)_40%,transparent)] hover:bg-[var(--ln-card)]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--ln-card)]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl ln-gold">
            ◆
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold leading-tight ln-fg">
              {item.name}
            </h3>
            {price ? (
              <span className="shrink-0 font-display text-lg font-semibold text-gradient-gold">
                {price}
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed ln-muted">
              {item.description}
            </p>
          ) : null}
        </div>
        {!item.available ? (
          <div className="mt-2">
            <span className="rounded-full bg-[color-mix(in_oklch,var(--ln-destructive)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium ln-destructive">
              Tükendi
            </span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
