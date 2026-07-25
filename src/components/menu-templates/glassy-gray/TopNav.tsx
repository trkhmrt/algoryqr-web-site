type TopNavProps = {
  businessName: string;
  active: "home" | "menu";
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onHome: () => void;
  onMenu: () => void;
  onBack?: () => void;
};

export function GlassyGrayTopNav({
  businessName,
  active,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onHome,
  onMenu,
  onBack,
}: TopNavProps) {
  return (
    <header className="gg-nav fixed top-0 z-50 w-full border-b border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 md:px-12">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="gg-primary active:scale-95"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onHome}
            className="gg-display gg-primary text-left text-xl font-semibold tracking-tight md:text-2xl"
          >
            {businessName}
          </button>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={onHome}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              active === "home" ? "gg-primary font-bold" : "gg-muted hover:bg-white/10"
            }`}
          >
            Ana Sayfa
          </button>
          <button
            type="button"
            onClick={onMenu}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              active === "menu" ? "gg-primary font-bold" : "gg-muted hover:bg-white/10"
            }`}
          >
            Menü
          </button>
        </div>

        <div className="w-8 md:w-8" />
      </div>

      {showSearch ? (
        <div className="border-t border-white/5 px-4 pb-3 md:px-12">
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 md:ml-auto md:max-w-md">
            <span className="material-symbols-outlined gg-muted mr-2 text-xl">search</span>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Ürün ara…"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--gg-muted)]"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="gg-muted ml-2 text-xs"
                aria-label="Aramayı temizle"
              >
                Temizle
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
