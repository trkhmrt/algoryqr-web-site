type TopNavProps = {
  businessName: string;
  logoUrl?: string | null;
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
  logoUrl,
  active,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onHome,
  onMenu,
  onBack,
}: TopNavProps) {
  return (
    <header className="gg-nav fixed left-0 right-0 top-0 z-50 mx-auto max-w-md border-b border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="gg-primary shrink-0 active:scale-95"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onHome}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            {logoUrl?.trim() ? (
              <img
                src={logoUrl.trim()}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg bg-white/90 object-contain p-0.5"
              />
            ) : null}
            <span className="gg-display gg-primary truncate text-lg font-semibold tracking-tight">
              {businessName}
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onHome}
            className={`rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              active === "home" ? "gg-primary" : "gg-muted"
            }`}
          >
            Ana
          </button>
          <button
            type="button"
            onClick={onMenu}
            className={`rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              active === "menu" ? "gg-primary" : "gg-muted"
            }`}
          >
            Menü
          </button>
        </div>
      </div>

      {showSearch ? (
        <div className="border-t border-white/5 px-4 pb-3">
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <span className="material-symbols-outlined gg-muted mr-2 text-lg">search</span>
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
