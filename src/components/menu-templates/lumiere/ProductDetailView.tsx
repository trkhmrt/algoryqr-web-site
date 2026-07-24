import type { MenuProductApiItem, NutritionFacts } from "@/lib/api";
import { formatMenuPrice } from "../types";
import { LUMIERE_DETAIL_FOOTER_IMAGE } from "./styles";

type ProductDetailViewProps = {
  product: MenuProductApiItem;
};

function nutritionRows(nutrition: NutritionFacts) {
  const rows: { label: string; value: string }[] = [];
  if (nutrition.energyKcal != null && nutrition.energyKcal !== "") {
    rows.push({ label: "Calories", value: `${nutrition.energyKcal} kcal` });
  }
  if (nutrition.protein != null && nutrition.protein !== "") {
    rows.push({ label: "Protein", value: `${nutrition.protein}g` });
  }
  if (nutrition.fat != null && nutrition.fat !== "") {
    rows.push({ label: "Total Fat", value: `${nutrition.fat}g` });
  }
  if (nutrition.carbohydrate != null && nutrition.carbohydrate !== "") {
    rows.push({ label: "Carbohydrates", value: `${nutrition.carbohydrate}g` });
  }
  if (nutrition.salt != null && nutrition.salt !== "") {
    const saltMg =
      typeof nutrition.salt === "number"
        ? Math.round(nutrition.salt * 1000)
        : nutrition.salt;
    rows.push({
      label: "Sodium",
      value: typeof saltMg === "number" ? `${saltMg}mg` : String(saltMg),
    });
  }
  return rows;
}

export function LumiereProductDetailView({ product }: ProductDetailViewProps) {
  const nutrition = product.nutrition ?? null;
  const rows = nutrition ? nutritionRows(nutrition) : [];
  const price = formatMenuPrice(product.price, product.currency);

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
              Signature Dish
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
              The Story
            </h3>
            <p className="lm-body-lg leading-relaxed text-[var(--lm-on-surface)]">
              {product.description}
            </p>
          </div>
        </section>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="px-[var(--lm-margin)]">
            <div className="h-px w-full bg-[var(--lm-outline-variant)]" />
          </div>
          <section className="px-[var(--lm-margin)] py-10">
            <div className="rounded-xl border border-[var(--lm-outline)] bg-[var(--lm-surface-container-highest)] p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="lm-headline-md">Nutritional Facts</h3>
                <span className="material-symbols-outlined text-[var(--lm-on-surface-variant)]">
                  analytics
                </span>
              </div>
              <div className="space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between border-b border-[var(--lm-outline-variant)] pb-1"
                  >
                    <span className="lm-body-sm">{row.label}</span>
                    <span className="lm-body-sm font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[10px] italic text-[var(--lm-on-surface-variant)]">
                * Values are approximate based on standard serving sizes.
              </p>
            </div>
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
              Culinary Excellence
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
