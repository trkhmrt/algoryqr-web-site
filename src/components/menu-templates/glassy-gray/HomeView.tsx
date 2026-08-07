import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { DenseFeaturedSlider } from "../shared";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  popular: MenuProductApiItem[];
  onSeeMenu: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function GlassyGrayHomeView({ menu, popular, onSeeMenu, onOpenProduct }: HomeViewProps) {
  return (
    <div className="flex flex-col">
      <section className="mb-6">
        <div className="gg-glass mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5">
          <span className="gg-dot h-1.5 w-1.5 rounded-full" />
          <span className="gg-accent text-[10px] font-bold uppercase tracking-widest">
            Dijital Menü
          </span>
        </div>
        <h1 className="gg-text-glow gg-display mb-2 text-2xl font-bold leading-tight">
          Lezzet Keşfine
          <span className="gg-primary italic"> Başlayın</span>
        </h1>
        <p className="gg-muted line-clamp-2 text-sm leading-relaxed">
          {menu.slogan?.trim() ||
            "Şeflerimizin özel kreasyonlarını anında keşfedin."}
        </p>
        <button
          type="button"
          onClick={onSeeMenu}
          className="gg-shimmer gg-cta gg-display mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-xl active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
          <span>Menüyü Gör</span>
        </button>
      </section>

      {popular.length > 0 ? (
        <section>
          <h2 className="gg-display mb-3 text-lg font-semibold text-white">
            Popüler lezzetler
          </h2>
          <DenseFeaturedSlider
            items={popular}
            onOpen={onOpenProduct}
            cardClassName="border-white/10 gg-glass-heavy"
            imageClassName="bg-white/5"
            titleClassName="text-white gg-display"
            priceClassName="gg-glass gg-primary"
            chipClassName="bg-white/10 gg-muted"
            accentChipClassName="bg-[var(--gg-primary)] text-[#1a120e]"
            destructiveChipClassName="bg-red-500/20 text-red-300"
            imagePlaceholderClassName="gg-muted"
          />
        </section>
      ) : (
        <p className="gg-glass-heavy gg-muted rounded-2xl p-6 text-center text-sm">
          Menüye henüz ürün eklenmemiş.
        </p>
      )}
    </div>
  );
}
