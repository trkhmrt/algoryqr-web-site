import type { MenuProductApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { formatServesPeopleLabel } from "../shared/serves-people";

type ProductCardProps = {
  item: MenuProductApiItem;
  variant?: "scroll" | "grid";
  onOpen: (product: MenuProductApiItem) => void;
};

export function GlassyGrayProductCard({ item, variant = "grid", onOpen }: ProductCardProps) {
  const servesLabel = formatServesPeopleLabel(item.servesPeopleMin, item.servesPeopleMax);
  return (
    <article
      className={`gg-glass-heavy group overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(255,182,147,0.4)] ${
        variant === "scroll" ? "gg-card snap-start p-4" : ""
      }`}
    >
      <button type="button" onClick={() => onOpen(item)} className="block w-full text-left">
        <div className={`relative overflow-hidden ${variant === "grid" ? "h-64" : "mb-4 h-48 rounded-2xl"}`}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="gg-placeholder flex h-full w-full items-center justify-center">
              <span className="material-symbols-outlined text-4xl">restaurant</span>
            </div>
          )}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            {servesLabel ? (
              <div className="gg-glass rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--gg-accent)]">
                {servesLabel}
              </div>
            ) : null}
            {!item.available ? (
              <div className="gg-glass rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--gg-accent)]">
                Tukendi
              </div>
            ) : null}
          </div>
        </div>
      </button>

      <div className={variant === "grid" ? "p-6" : ""}>
        <button type="button" onClick={() => onOpen(item)} className="mb-2 flex w-full items-start justify-between gap-3 text-left">
          <h4 className="gg-display gg-on-surface text-lg font-semibold">{item.name}</h4>
          <div className="gg-display gg-primary shrink-0 text-xl font-bold">
            {formatMenuPrice(item.price, item.currency)}
          </div>
        </button>
        {item.description ? (
          <p className="gg-muted mb-4 line-clamp-2 text-sm leading-5">{item.description}</p>
        ) : (
          <div className="mb-4" />
        )}
        <button
          type="button"
          onClick={() => onOpen(item)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
            variant === "grid" ? "gg-cta" : "gg-glass"
          }`}
        >
          <span className="material-symbols-outlined text-xl">visibility</span>
          Ürünü İncele
        </button>
      </div>
    </article>
  );
}
