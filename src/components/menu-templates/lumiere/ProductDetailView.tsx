import type { MenuProductApiItem } from "@/lib/api";

import { formatMenuPrice } from "../types";
import { MenuNutritionFacts, hasNutritionFacts } from "../shared";
import { LUMIERE_DETAIL_FOOTER_IMAGE } from "./styles";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
};

export function LumiereProductDetailView({ product }: ProductDetailViewProps) {
  const price = formatMenuPrice(product.price, product.currency);
  const showNutrition = hasNutritionFacts(product.nutrition);

  return (
    <div>
      <section className="relative h-[442px] w-full overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="lm-placeholder flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-6xl">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-6 left-[var(--lm-margin)] right-[var(--lm-margin)]">
          {!product.available ? (
            <span className="lm-badge mb-2 inline-block rounded px-2 py-1 uppercase">
              Tükendi
            </span>
          ) : (
            <span className="lm-badge mb-2 inline-block rounded px-2 py-1 uppercase">
              Öne çıkan
            </span>
          )}
          <h2 className="lm-headline-lg text-white drop-shadow-md">{product.name}</h2>
          {price ? (
            <p className="lm-headline-md mt-1 text-white/90">{price}</p>
          ) : null}
        </div>
      </section>

      {product.description ? (
        <section className="px-[var(--lm-margin)] py-10">
          <div className="mx-auto max-w-2xl">
            <h3 className="lm-label-caps mb-4 uppercase tracking-widest text-[var(--lm-primary)]">
              Açıklama
            </h3>
            <p className="lm-body-lg leading-relaxed text-[var(--lm-on-surface)]">
              {product.description}
            </p>
          </div>
        </section>
      ) : null}

      {showNutrition ? (
        <>
          <div className="px-[var(--lm-margin)]">
            <div className="h-px w-full bg-[var(--lm-outline-variant)]" />
          </div>
          <section className="px-[var(--lm-margin)] py-10">
            <MenuNutritionFacts
              nutrition={product.nutrition}
              className="rounded-xl border border-[var(--lm-outline)] bg-[var(--lm-surface-container-highest)] p-6"
              titleClassName="lm-headline-md text-[var(--lm-on-surface)]"
              basisClassName="text-[var(--lm-on-surface-variant)]"
              rowClassName="border-[var(--lm-outline-variant)]"
              labelClassName="lm-body-sm text-[var(--lm-on-surface)]"
              valueClassName="lm-body-sm font-bold text-[var(--lm-on-surface)]"
              footnoteClassName="text-[var(--lm-on-surface-variant)]"
            />
          </section>
        </>
      ) : null}

      <section className="px-[var(--lm-margin)] py-10">
        <div className="group relative h-48 overflow-hidden rounded-2xl">
          <img
            src={LUMIERE_DETAIL_FOOTER_IMAGE}
            alt=""
            className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-transparent">
            <span className="lm-label-caps uppercase tracking-[0.3em] text-white">
              Mutfak ustalığı
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
