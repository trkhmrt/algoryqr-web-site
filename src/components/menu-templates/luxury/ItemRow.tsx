import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import { formatServesPeopleLabel } from "../shared/serves-people";

type ItemRowProps = {
  item: MenuProductApiItem;
  onOpen: (item: MenuProductApiItem) => void;
};

export function ItemRow({ item, onOpen }: ItemRowProps) {
  const price = formatMenuPrice(item.price, item.currency);
  const servesLabel = formatServesPeopleLabel(item.servesPeopleMin, item.servesPeopleMax);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-stretch gap-4 rounded-2xl border border-[var(--lx-border)] bg-[color-mix(in_oklch,var(--lx-card)_60%,transparent)] p-3 text-left transition hover:border-[color-mix(in_oklch,var(--lx-gold)_40%,transparent)] hover:bg-[var(--lx-card)]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--lx-card)]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl lx-gold">
            ◆
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold leading-tight lx-fg">
              {item.name}
            </h3>
            {price ? (
              <span className="shrink-0 font-display text-lg font-semibold text-gradient-gold">
                {price}
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed lx-muted">
              {item.description}
            </p>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {servesLabel ? (
            <span className="rounded-full bg-[color-mix(in_oklch,var(--lx-gold)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium lx-gold">
              {servesLabel}
            </span>
          ) : null}
          {!item.available ? (
            <span className="rounded-full bg-[color-mix(in_oklch,var(--lx-destructive)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium lx-destructive">
              Tükendi
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
