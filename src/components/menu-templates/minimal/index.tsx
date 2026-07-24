"use client";

import { useRef } from "react";

import type { MenuTemplateProps } from "../types";
import { filterProductsByNavCategory, formatMenuPrice, resolveMenuNavCategories } from "../types";
import { useListTemplateCategoryAnalytics } from "../use-list-template-analytics";

export function MinimalMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navCategories = resolveMenuNavCategories(categories, products);
  useListTemplateCategoryAnalytics(analytics, rootRef);

  return (
    <div ref={rootRef} className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-light tracking-wide">{menu.businessName}</h1>
        {menu.slogan && <p className="mt-2 text-sm text-neutral-500">{menu.slogan}</p>}
        <div className="mt-4 space-y-1 text-sm text-neutral-500">
          {menu.phone && <p>{menu.phone}</p>}
          {menu.email && <p>{menu.email}</p>}
          {menu.address && <p>{menu.address}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-12 space-y-10">
        {navCategories.map((category) => {
          const items = filterProductsByNavCategory(products, category);
          return (
            <section
              key={category.key}
              data-analytics-category={category.categoryId ?? undefined}
            >
              <h2 className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-neutral-400">{category.name}</h2>
              {items.length > 0 ? (
                <div className="space-y-6">
                  {items.map((item) => (
                    <article
                      key={item.productId}
                      className="cursor-pointer border-b border-neutral-200 pb-6 last:border-0"
                      onClick={() => analytics?.trackProductView(item.productId, item.categoryId)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          {item.description && <p className="mt-2 text-sm text-neutral-500">{item.description}</p>}
                        </div>
                        <span className="shrink-0 text-sm">{formatMenuPrice(item.price, item.currency)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-400">Bu kategoride henuz urun yok.</p>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
