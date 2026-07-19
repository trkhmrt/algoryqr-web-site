import type { MenuTemplateProps } from "../types";
import { filterProductsByNavCategory, formatMenuPrice, resolveMenuNavCategories } from "../types";

export function ModernMenuTemplate({ menu, products, categories = [] }: MenuTemplateProps) {
  const navCategories = resolveMenuNavCategories(categories, products);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Digital Menu</p>
          <h1 className="mt-2 text-4xl font-bold">{menu.businessName}</h1>
          {menu.slogan && <p className="mt-2 text-base text-white/85">{menu.slogan}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
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
            <section key={category.key}>
              <h2 className="mb-4 text-lg font-semibold text-indigo-300">{category.name}</h2>
              {items.length > 0 ? (
                <div className="grid gap-3">
                  {items.map((item) => (
                    <article key={item.productId} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <h3 className="font-medium">{item.name}</h3>
                            <span className="text-indigo-300">{formatMenuPrice(item.price, item.currency)}</span>
                          </div>
                          {item.description && <p className="mt-1 text-sm text-white/60">{item.description}</p>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Bu kategoride henuz urun yok.</p>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
