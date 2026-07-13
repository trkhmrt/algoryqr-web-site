import type { MenuTemplateProps } from "./types";
import { formatMenuPrice, groupProductsByCategory } from "./types";

export function DarkMenuTemplate({ menu, products }: MenuTemplateProps) {
  const groups = groupProductsByCategory(products);
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">{menu.businessName}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
            {menu.phone && <span>{menu.phone}</span>}
            {menu.email && <span>{menu.email}</span>}
            {menu.address && <span>{menu.address}</span>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {groups.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.productId} className="rounded-xl bg-neutral-900 p-4 ring-1 ring-neutral-800">
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
          </section>
        ))}
      </main>
    </div>
  );
}
