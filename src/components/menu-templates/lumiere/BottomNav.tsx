import type { LumiereNavTab } from "./category-utils";

type BottomNavProps = {
  active: LumiereNavTab;
  onMenu: () => void;
  onSearch: () => void;
  onSpecials: () => void;
  onInfo: () => void;
};

const TABS: {
  id: LumiereNavTab;
  icon: string;
  label: string;
}[] = [
  { id: "menu", icon: "menu_book", label: "Menü" },
  { id: "search", icon: "search", label: "Ara" },
  { id: "specials", icon: "auto_awesome", label: "Özel" },
  { id: "info", icon: "info", label: "Bilgi" },
];

export function LumiereBottomNav({
  active,
  onMenu,
  onSearch,
  onSpecials,
  onInfo,
}: BottomNavProps) {
  const handlers: Record<LumiereNavTab, () => void> = {
    menu: onMenu,
    search: onSearch,
    specials: onSpecials,
    info: onInfo,
  };

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-[var(--lm-outline-variant)] bg-[var(--lm-surface)]">
      <div className="mx-auto flex max-w-screen-xl items-center justify-around px-[var(--lm-margin)] py-2">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={handlers[tab.id]}
              className={`flex flex-col items-center justify-center transition-transform duration-150 active:scale-95 ${
                isActive
                  ? "font-bold text-[var(--lm-primary)]"
                  : "text-[var(--lm-on-surface-variant)] hover:text-[var(--lm-primary)]"
              }`}
            >
              <span
                className={`material-symbols-outlined ${isActive ? "lm-fill" : ""}`}
              >
                {tab.icon}
              </span>
              <span className="lm-label-caps mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
