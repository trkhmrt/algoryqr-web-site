import type { MenuProductApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { formatServesPeopleLabel } from "../shared/serves-people";

type ProductCardProps = {
  item: MenuProductApiItem;
  onOpen: (product: MenuProductApiItem) => void;
};

export function LumiereProductCard({ item, onOpen }: ProductCardProps) {
  const servesLabel = formatServesPeopleLabel(item.servesPeopleMin, item.servesPeopleMax);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group overflow-hidden rounded-xl border border-[var(--lm-outline-variant)] bg-[var(--lm-surface-container-lowest)] text-left transition-all hover:border-[color-mix(in_srgb,var(--lm-primary)_30%,transparent)] active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--lm-surface-container-low)]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="lm-placeholder flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl">restaurant</span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-1">
          {servesLabel ? (
            <span className="lm-badge rounded px-2 py-1 text-[10px] uppercase tracking-widest">
              {servesLabel}
            </span>
          ) : null}
          {!item.available ? (
            <span className="lm-badge rounded px-2 py-1 text-[10px] uppercase tracking-widest">
              Tükendi
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="lm-headline-md text-[var(--lm-on-surface)]">{item.name}</h4>
          <span className="lm-headline-md shrink-0 text-[var(--lm-primary)]">
            {formatMenuPrice(item.price, item.currency)}
          </span>
        </div>
        {item.description ? (
          <p className="lm-body-sm line-clamp-2 text-[var(--lm-on-surface-variant)]">
            {item.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
