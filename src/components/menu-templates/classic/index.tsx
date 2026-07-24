"use client";

import { useRef } from "react";

import type { MenuTemplateProps } from "../types";
import { filterProductsByNavCategory, formatMenuPrice, resolveMenuNavCategories } from "../types";
import { useListTemplateCategoryAnalytics } from "../use-list-template-analytics";

export function ClassicMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navCategories = resolveMenuNavCategories(categories, products);
  useListTemplateCategoryAnalytics(analytics, rootRef);

  return (
    <div ref={rootRef} className="min-h-screen bg-amber-50 text-amber-950">
      <header className="border-b border-amber-200 bg-amber-100/80 px-4 py-8 text-center">
        <h1 className="text-3xl font-serif font-bold">{menu.businessName}</h1>
        {menu.slogan && <p className="mt-2 text-base text-amber-900/80">{menu.slogan}</p>}
        <div className="mt-3 space-y-1 text-sm text-amber-900/80">
          {menu.phone && <p>{menu.phone}</p>}
          {menu.email && <p>{menu.email}</p>}
          {menu.address && <p>{menu.address}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {navCategories.map((category) => {
          const items = filterProductsByNavCategory(products, category);
          return (
            <section
              key={category.key}
              data-analytics-category={category.categoryId ?? undefined}
            >
              <h2 className="mb-4 border-b border-amber-300 pb-2 text-xl font-semibold">{category.name}</h2>
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.productId}
                      className="flex cursor-pointer gap-4 rounded-xl bg-white/70 p-4 shadow-sm"
                      onClick={() => analytics?.trackProductView(item.productId, item.categoryId)}
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold">{item.name}</h3>
                          <span className="shrink-0 font-medium">{formatMenuPrice(item.price, item.currency)}</span>
                        </div>
                        {item.description && <p className="mt-1 text-sm text-amber-900/70">{item.description}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-900/60">Bu kategoride henuz urun yok.</p>
              )}
            </section>
          );
        })}
        {navCategories.length === 0 ? (
          <p className="text-center text-sm text-amber-900/60">Menuye henuz urun eklenmemis.</p>
        ) : null}
      </main>
    </div>
  );
}
