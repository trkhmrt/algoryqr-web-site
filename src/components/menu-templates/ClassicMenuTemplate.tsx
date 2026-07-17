import type { MenuTemplateProps } from "./types";
import { formatMenuPrice, groupProductsByCategory } from "./types";

export function ClassicMenuTemplate({ menu, products }: MenuTemplateProps) {
  const groups = groupProductsByCategory(products);
  return (
    <div className="min-h-screen bg-amber-50 text-amber-950">
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
        {groups.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-4 border-b border-amber-300 pb-2 text-xl font-semibold">{category}</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.productId} className="flex gap-4 rounded-xl bg-white/70 p-4 shadow-sm">
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
          </section>
        ))}
      </main>
    </div>
  );
}
