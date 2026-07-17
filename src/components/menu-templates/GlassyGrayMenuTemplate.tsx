"use client";

import { useMemo, useState } from "react";

import type { MenuProductApiItem } from "@/lib/api";
import type { MenuTemplateProps } from "./types";
import { formatMenuPrice, groupProductsByCategory } from "./types";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBM_pr-HBuexEH2kGEtpHF3f72QShFLTSolPtJG3-85F7IKonHcBnYtQNL5VPR8TkUXfBPCp54LaoqLhlagjdkZkR_o1mtImdOhaKM0I1Bdyb2SsPQAgLGgrVNQ41IR1AAxaRV1EBSRt-5rL-D47OiofduEa3ivrFsL-fQUOHcipY12yH5Mv9UYnWd7fRwWWssGHwA9orvmbvuOwvSVZtkRKQvvAXrPTIcppujXfh7IFzkNkignXfLD8WvsMI8YYpSBehH_rejrCav8";

function scrollToCategory(categoryId: string) {
  const el = document.getElementById(categoryId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function categoryDomId(category: string) {
  return `gg-cat-${category.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
}

function ProductCard({ item }: { item: MenuProductApiItem }) {
  return (
    <article className="gg-glass-heavy group gg-card snap-start rounded-3xl p-4">
      {item.imageUrl ? (
        <div className="mb-4 h-48 overflow-hidden rounded-2xl">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="gg-placeholder mb-4 flex h-48 items-center justify-center rounded-2xl">
          <span className="material-symbols-outlined text-4xl">restaurant</span>
        </div>
      )}
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="gg-display gg-on-surface text-lg font-semibold">{item.name}</h4>
        <div className="gg-display gg-primary shrink-0 text-xl font-bold">
          {formatMenuPrice(item.price, item.currency)}
        </div>
      </div>
      {item.description ? (
        <p className="gg-muted mb-3 text-sm leading-5">{item.description}</p>
      ) : null}
      {!item.available ? (
        <span className="gg-badge rounded px-2 py-0.5 text-xs font-bold">Tukendi</span>
      ) : null}
    </article>
  );
}

export function GlassyGrayMenuTemplate({ menu, products }: MenuTemplateProps) {
  const groups = useMemo(() => groupProductsByCategory(products), [products]);
  const [activeCategory, setActiveCategory] = useState(groups[0]?.[0] ?? "");
  const featured = products.filter((p) => p.available && p.imageUrl).slice(0, 6);
  const highlightProducts = featured.length > 0 ? featured : products.slice(0, 6);

  return (
    <div className="glassy-gray-menu relative min-h-screen overflow-x-hidden">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap");
        .glassy-gray-menu {
          --gg-font-display: "Plus Jakarta Sans", sans-serif;
          --gg-font-body: "Hanken Grotesk", sans-serif;
          --gg-bg: #131313;
          --gg-primary: #ffb693;
          --gg-primary-container: #ff6b00;
          --gg-on-primary-container: #572000;
          --gg-muted: #e2bfb0;
          --gg-outline: #a98a7d;
          --gg-accent: #caf300;
          --gg-on-surface: #e5e2e1;
          background-color: var(--gg-bg);
          color: var(--gg-on-surface);
          font-family: var(--gg-font-body);
        }
        .glassy-gray-menu .gg-display { font-family: var(--gg-font-display); }
        .glassy-gray-menu .gg-primary { color: var(--gg-primary); }
        .glassy-gray-menu .gg-muted { color: var(--gg-muted); }
        .glassy-gray-menu .gg-on-surface { color: var(--gg-on-surface); }
        .glassy-gray-menu .gg-accent { color: var(--gg-accent); }
        .glassy-gray-menu .gg-outline { color: var(--gg-outline); }
        .glassy-gray-menu .gg-card { min-width: 280px; }
        .glassy-gray-menu .gg-placeholder {
          background: rgba(255, 255, 255, 0.05);
          color: var(--gg-outline);
        }
        .glassy-gray-menu .gg-badge {
          background: rgba(255, 182, 147, 0.1);
          color: var(--gg-primary);
        }
        .glassy-gray-menu .gg-nav {
          background: rgba(19, 19, 19, 0.8);
        }
        .glassy-gray-menu .gg-aside {
          background: rgba(14, 14, 14, 0.9);
        }
        .glassy-gray-menu .gg-footer {
          background: rgba(19, 19, 19, 0.6);
        }
        .glassy-gray-menu .gg-cta {
          background: var(--gg-primary-container);
          color: var(--gg-on-primary-container);
        }
        .glassy-gray-menu .gg-cta-icon {
          background: var(--gg-primary-container);
          color: var(--gg-on-primary-container);
        }
        .glassy-gray-menu .gg-dot { background: var(--gg-accent); }
        .glassy-gray-menu .gg-hero-fade {
          background: linear-gradient(to bottom, #131313, rgba(19, 19, 19, 0.4), #131313);
        }
        .glassy-gray-menu .gg-glow-a {
          background: rgba(255, 182, 147, 0.2);
        }
        .glassy-gray-menu .gg-glow-b {
          background: rgba(202, 243, 0, 0.1);
        }
        .glassy-gray-menu .gg-active-chip {
          background: var(--gg-primary-container);
          color: var(--gg-on-primary-container);
        }
        .glassy-gray-menu .gg-mobile-tab {
          max-width: 4.5rem;
        }
        .glassy-gray-menu .gg-mobile-tab-label {
          font-size: 0.5rem;
        }
        .glassy-gray-menu .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
        }
        .gg-glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .gg-glass-heavy {
          background: rgba(19, 19, 19, 0.60);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .gg-text-glow {
          text-shadow: 0 0 20px rgba(255, 182, 147, 0.3);
        }
        .gg-shimmer {
          position: relative;
          overflow: hidden;
        }
        .gg-shimmer::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: rotate(45deg);
          animation: gg-shimmer 3s infinite;
        }
        @keyframes gg-shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .gg-no-scrollbar::-webkit-scrollbar { display: none; }
        .gg-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="h-full w-full scale-105 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
        <div className="gg-hero-fade absolute inset-0" />
      </div>

      <nav className="gg-nav fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/10 px-4 py-4 shadow-2xl backdrop-blur-xl md:px-12">
        <div className="gg-display gg-primary text-2xl font-semibold tracking-tight">
          {menu.businessName}
        </div>
        <div className="hidden items-center gap-6 md:flex">
          {groups.slice(0, 5).map(([category]) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                scrollToCategory(categoryDomId(category));
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeCategory === category
                  ? "gg-primary font-bold"
                  : "gg-muted hover:bg-white/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="gg-cta-icon flex h-8 w-8 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-sm">restaurant</span>
        </div>
      </nav>

      <aside className="gg-aside fixed left-0 z-50 hidden h-full w-64 flex-col gap-4 border-r border-white/10 p-6 pt-24 shadow-2xl backdrop-blur-3xl lg:flex">
        <div className="mb-4 flex items-center gap-3">
          <div className="gg-cta-icon flex h-10 w-10 items-center justify-center rounded-xl">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div>
            <div className="gg-display gg-primary text-lg font-bold">{menu.businessName}</div>
            {menu.slogan ? <div className="gg-muted text-xs">{menu.slogan}</div> : null}
          </div>
        </div>
        <div className="space-y-1 overflow-y-auto">
          {groups.map(([category]) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                scrollToCategory(categoryDomId(category));
              }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-transform hover:translate-x-1 ${
                activeCategory === category
                  ? "gg-primary bg-white/5 font-bold"
                  : "gg-muted"
              }`}
            >
              <span className="material-symbols-outlined text-xl">restaurant_menu</span>
              <span className="text-left text-base">{category}</span>
            </button>
          ))}
        </div>
        {(menu.phone || menu.address) && (
          <div className="gg-outline mt-auto space-y-1 text-xs">
            {menu.phone ? <p>{menu.phone}</p> : null}
            {menu.address ? <p>{menu.address}</p> : null}
          </div>
        )}
      </aside>

      <main className="relative z-10 flex min-h-screen flex-col px-4 pb-28 pt-28 md:px-12 lg:ml-64">
        <section className="max-w-4xl">
          <div className="gg-glass mb-4 inline-flex animate-pulse items-center gap-2 rounded-full px-4 py-2">
            <span className="gg-dot h-2 w-2 rounded-full" />
            <span className="gg-accent text-xs font-bold uppercase tracking-widest">
              Dijital Menu
            </span>
          </div>
          <h1 className="gg-text-glow gg-display mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {menu.businessName}
            {menu.slogan ? (
              <>
                <br />
                <span className="gg-primary italic">{menu.slogan}</span>
              </>
            ) : null}
          </h1>
          <p className="gg-muted mb-8 max-w-xl text-lg leading-7">
            Seflerimizin ozel kreasyonlarini kesfedin.
          </p>
          <button
            type="button"
            onClick={() => {
              const first = groups[0]?.[0];
              if (first) {
                setActiveCategory(first);
                scrollToCategory(categoryDomId(first));
              }
            }}
            className="gg-shimmer gg-cta gg-display flex items-center justify-center gap-3 rounded-2xl px-10 py-5 font-bold shadow-2xl transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span>Menuyu Gor</span>
          </button>
        </section>

        {highlightProducts.length > 0 ? (
          <section className="mt-20">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <h2 className="gg-display text-2xl font-semibold">Populer Lezzetler</h2>
                <p className="gg-muted">One cikan urunler</p>
              </div>
            </div>
            <div className="gg-no-scrollbar flex gap-6 overflow-x-auto snap-x pb-8">
              {highlightProducts.map((item) => (
                <ProductCard key={`featured-${item.productId}`} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 space-y-14">
          {groups.map(([category, items]) => (
            <div key={category} id={categoryDomId(category)} className="scroll-mt-28">
              <h2 className="gg-display gg-primary mb-6 text-2xl font-semibold">{category}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <ProductCard key={item.productId} item={item} />
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 ? (
            <p className="gg-glass-heavy gg-muted rounded-3xl p-8 text-center">
              Menuye henuz urun eklenmemis.
            </p>
          ) : null}
        </section>
      </main>

      <footer className="gg-footer fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-white/10 px-2 pb-4 pt-2 shadow-2xl backdrop-blur-2xl md:hidden">
        {groups.slice(0, 4).map(([category]) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setActiveCategory(category);
              scrollToCategory(categoryDomId(category));
            }}
            className={`gg-mobile-tab flex flex-col items-center justify-center p-2 transition-all active:scale-90 ${
              activeCategory === category ? "gg-active-chip rounded-full px-3" : "gg-muted"
            }`}
          >
            <span className="material-symbols-outlined text-xl">restaurant_menu</span>
            <span className="gg-mobile-tab-label mt-1 truncate font-bold uppercase tracking-wider">
              {category}
            </span>
          </button>
        ))}
      </footer>

      <div className="pointer-events-none fixed inset-0 z-40 opacity-30">
        <div className="gg-glow-a absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="gg-glow-b absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
