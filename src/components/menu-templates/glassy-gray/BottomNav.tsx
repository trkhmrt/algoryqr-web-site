type BottomNavProps = {
  active: "home" | "menu";
  onHome: () => void;
  onMenu: () => void;
};

export function GlassyGrayBottomNav({ active, onHome, onMenu }: BottomNavProps) {
  return (
    <footer className="gg-footer fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-white/10 px-2 pb-4 pt-2 shadow-2xl backdrop-blur-2xl md:hidden">
      <button
        type="button"
        onClick={onHome}
        className={`flex flex-col items-center justify-center p-3 transition-all active:scale-90 ${
          active === "home" ? "gg-active-chip rounded-full" : "gg-muted"
        }`}
      >
        <span className="material-symbols-outlined">home</span>
        <span className="gg-mobile-tab-label mt-1 font-bold uppercase tracking-wider">Home</span>
      </button>
      <button
        type="button"
        onClick={onMenu}
        className={`flex flex-col items-center justify-center p-3 transition-all active:scale-90 ${
          active === "menu" ? "gg-active-chip rounded-full" : "gg-muted"
        }`}
      >
        <span className="material-symbols-outlined">restaurant_menu</span>
        <span className="gg-mobile-tab-label mt-1 font-bold uppercase tracking-wider">Menu</span>
      </button>
    </footer>
  );
}
