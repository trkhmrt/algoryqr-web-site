import type { MenuProductApiItem, MenuProfileApiItem } from "@/lib/api";
import { GlassyGrayProductCard } from "./ProductCard";
import { GLASSY_GRAY_FEATURE_IMAGE } from "./styles";

type HomeViewProps = {
  menu: MenuProfileApiItem;
  popular: MenuProductApiItem[];
  onSeeMenu: () => void;
  onOpenProduct: (product: MenuProductApiItem) => void;
};

export function GlassyGrayHomeView({ menu, popular, onSeeMenu, onOpenProduct }: HomeViewProps) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <section className="max-w-4xl">
        <div className="gg-glass mb-4 inline-flex animate-pulse items-center gap-2 rounded-full px-4 py-2">
          <span className="gg-dot h-2 w-2 rounded-full" />
          <span className="gg-accent text-xs font-bold uppercase tracking-widest">
            Dijital Menu
          </span>
        </div>
        <h1 className="gg-text-glow gg-display mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Lezzet Kesfine
          <br />
          <span className="gg-primary italic">Baslayin</span>
        </h1>
        <p className="gg-muted mb-8 max-w-xl text-lg leading-7">
          Fine dining deneyimini dijitalle bulusturuyoruz.
          {menu.slogan ? ` ${menu.slogan}` : " Seflerimizin ozel kreasyonlarini aninda kesfedin."}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onSeeMenu}
            className="gg-shimmer gg-cta gg-display flex items-center justify-center gap-3 rounded-2xl px-10 py-5 font-bold shadow-2xl transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span>Menuyu Gor</span>
          </button>
          {(menu.phone || menu.address) && (
            <a
              href={menu.phone ? `tel:${menu.phone.replace(/\s+/g, "")}` : "#"}
              className="gg-glass gg-display rounded-2xl border border-white/10 px-10 py-5 text-center font-bold transition-colors hover:bg-white/10 active:scale-95"
            >
              Hakkimizda
            </a>
          )}
        </div>
      </section>

      <section className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="gg-glass-heavy group overflow-hidden rounded-3xl md:col-span-2">
          <div className="relative h-64 overflow-hidden">
            <img
              src={GLASSY_GRAY_FEATURE_IMAGE}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="rounded-full bg-[var(--gg-accent)] px-3 py-1 text-[10px] font-bold text-[#2a3400]">
                NEW
              </span>
              <h3 className="gg-display mt-2 text-xl font-semibold text-white">Sefin Gunlugu</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="gg-muted text-sm">
              Mevsimsel malzemelerle hazirlanan, doganin sundugu en taze lezzetler. Her hafta yenilenen
              sefin ozel secimlerini kesfedin.
            </p>
          </div>
        </div>

        <div className="gg-glass-heavy flex flex-col justify-between rounded-3xl border-t-2 border-[rgba(255,182,147,0.2)] p-6">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,182,147,0.1)]">
              <span className="material-symbols-outlined gg-primary">local_bar</span>
            </div>
            <h3 className="gg-display mb-2 text-xl font-semibold">Mixology</h3>
            <p className="gg-muted text-sm">El yapimi kokteyller ve nadir bulunan sarap seckimizle tanisin.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onSeeMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-[var(--gg-primary)] hover:text-[var(--gg-on-primary-container)]"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        {[
          { n: "01", title: "Hizli Siparis", desc: "Beklemeden siparisinizi iletin." },
          { n: "02", title: "Hijyenik Deneyim", desc: "Temassiz menu ve odeme." },
          { n: "03", title: "Gorsel Solen", desc: "Her tabagin hikayesini gorun." },
        ].map((item) => (
          <div key={item.n} className="gg-glass flex items-center gap-4 rounded-3xl p-6">
            <div
              className={`gg-display text-3xl font-bold ${
                item.n === "02" ? "gg-primary" : "gg-accent"
              }`}
            >
              {item.n}
            </div>
            <div>
              <div className="gg-display text-base font-semibold">{item.title}</div>
              <div className="gg-muted text-xs">{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="gg-display text-2xl font-semibold">Populer Lezzetler</h2>
            <p className="gg-muted">Misafirlerimizin en cok tercih ettigi kreasyonlar</p>
          </div>
          <button
            type="button"
            onClick={onSeeMenu}
            className="gg-primary flex items-center gap-2 font-bold hover:underline"
          >
            Tum Menu
            <span className="material-symbols-outlined">trending_flat</span>
          </button>
        </div>
        {popular.length > 0 ? (
          <div className="gg-no-scrollbar flex gap-6 overflow-x-auto snap-x pb-8">
            {popular.map((item) => (
              <GlassyGrayProductCard
                key={`popular-${item.productId}`}
                item={item}
                variant="scroll"
                onOpen={onOpenProduct}
              />
            ))}
          </div>
        ) : (
          <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
            Menuye henuz urun eklenmemis.
          </p>
        )}
      </section>
    </div>
  );
}
