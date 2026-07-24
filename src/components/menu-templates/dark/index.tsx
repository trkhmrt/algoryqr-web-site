"use client";

import { useRef } from "react";

import type { MenuTemplateProps } from "../types";
import { filterProductsByNavCategory, formatMenuPrice, resolveMenuNavCategories } from "../types";
import { useListTemplateCategoryAnalytics } from "../use-list-template-analytics";

export function DarkMenuTemplate({
  menu,
  products,
  categories = [],
  analytics,
}: MenuTemplateProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navCategories = resolveMenuNavCategories(categories, products);
  useListTemplateCategoryAnalytics(analytics, rootRef);

  return (
    <div ref={rootRef} className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">{menu.businessName}</h1>
          {menu.slogan && <p className="mt-2 text-base text-neutral-300">{menu.slogan}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
            {menu.phone && <span>{menu.phone}</span>}
            {menu.email && <span>{menu.email}</span>}
            {menu.address && <span>{menu.address}</span>}
          </div>
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
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">{category.name}</h2>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.productId}
                      className="cursor-pointer rounded-xl bg-neutral-900 p-4 ring-1 ring-neutral-800"
                      onClick={() => analytics?.trackProductView(item.productId, item.categoryId)}
                    >
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <h3 className="font-medium">{item.name}</h3>
                            <span className="text-emerald-400">{formatMenuPrice(item.price, item.currency)}</span>
                          </div>
                          {item.description && <p className="mt-1 text-sm text-neutral-400">{item.description}</p>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Bu kategoride henuz urun yok.</p>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
