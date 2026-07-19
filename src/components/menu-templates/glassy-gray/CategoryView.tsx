import type { MenuCategoryApiItem, MenuProductApiItem } from "@/lib/api";
import { GlassyGrayProductCard } from "./ProductCard";
import { GLASSY_GRAY_CATEGORY_HERO } from "./styles";

type CategoryViewProps = {
  category: MenuCategoryApiItem;
  products: MenuProductApiItem[];
  searchQuery: string;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function GlassyGrayCategoryView({
  category,
  products,
  searchQuery,
  onOpenProduct,
}: CategoryViewProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      )
    : products;

  return (
    <section>
      <div className="group relative mb-8 h-[300px] overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('${GLASSY_GRAY_CATEGORY_HERO}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gg-bg)] via-[rgba(19,19,19,0.2)] to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="gg-text-glow gg-display mb-2 text-4xl font-bold text-white md:text-5xl">
            {category.name}
          </h1>
          <p className="gg-muted max-w-xl text-lg">
            Duyularinizi harekete gecirecek, ustalikla hazirlanmis gurme lezzetler. Her tabak bir
            hikaye anlatir.
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <GlassyGrayProductCard key={item.productId} item={item} onOpen={onOpenProduct} />
          ))}
        </div>
      ) : (
        <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
          {q
            ? `"${searchQuery}" icin sonuc bulunamadi.`
            : `"${category.name}" kategorisinde henuz urun yok.`}
        </p>
      )}
    </section>
  );
}
