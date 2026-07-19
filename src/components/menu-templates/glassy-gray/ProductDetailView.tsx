import type { MenuProductApiItem } from "@/lib/api";
import { formatMenuPrice } from "../types";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
  onBack: () => void;
};

export function GlassyGrayProductDetailView({ product, onBack }: ProductDetailViewProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="gg-muted mb-6 hidden items-center gap-2 text-sm hover:text-[var(--gg-primary)] md:flex"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Geri
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-7">
          <div className="group relative overflow-hidden rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="gg-placeholder flex aspect-[4/5] w-full items-center justify-center">
                <span className="material-symbols-outlined text-6xl">restaurant</span>
              </div>
            )}
            <div className="gg-glass absolute right-6 top-6 flex flex-col items-center rounded-2xl px-6 py-4">
              <span className="gg-muted mb-1 text-[10px] font-bold uppercase tracking-widest">
                {product.available ? "Menu" : "Tukendi"}
              </span>
              <span className="gg-display gg-primary text-3xl font-bold">
                {formatMenuPrice(product.price, product.currency)}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 lg:hidden">
              <h2 className="gg-display mb-2 text-3xl font-bold text-white">{product.name}</h2>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="gg-glass relative overflow-hidden rounded-[2rem] p-8 shadow-2xl md:p-10">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[rgba(255,182,147,0.05)] blur-3xl" />

            <div className="mb-6 hidden lg:block">
              <h2 className="gg-display text-4xl font-bold leading-tight text-white">
                {product.name}
              </h2>
              {!product.available ? (
                <div className="mt-4">
                  <span className="gg-badge rounded-full px-3 py-1 text-xs font-bold uppercase">
                    Tukendi
                  </span>
                </div>
              ) : null}
            </div>

            {product.description ? (
              <div className="mb-8">
                <h3 className="gg-display mb-2 text-xl font-semibold text-white">Aciklama</h3>
                <p className="gg-muted text-lg leading-7">{product.description}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onBack}
              className="gg-cta flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-xl font-bold shadow-[0_20px_40px_-10px_rgba(255,107,0,0.4)] transition-all hover:brightness-110 active:scale-95"
            >
              <span className="material-symbols-outlined">restaurant_menu</span>
              Menüye Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
