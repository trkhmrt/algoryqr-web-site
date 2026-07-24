type TopNavProps = {
  businessName: string;
  variant?: "home" | "detail";
  onBack?: () => void;
};

export function LumiereTopNav({
  businessName,
  variant = "home",
  onBack,
}: TopNavProps) {
  const title = businessName.trim() || "Menü";

  if (variant === "detail") {
    return (
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--lm-outline-variant)] bg-[color-mix(in_srgb,var(--lm-surface)_80%,transparent)] backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-[var(--lm-margin)]">
          <button
            type="button"
            onClick={onBack}
            className="lm-muted p-1 transition-opacity hover:opacity-80"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="lm-headline-md tracking-tighter text-[var(--lm-on-surface)]">{title}</h1>
          <div className="w-6" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--lm-outline-variant)] bg-[var(--lm-surface)]">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-[var(--lm-margin)]">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined lm-primary">restaurant_menu</span>
          <h1 className="lm-headline-md tracking-tighter text-[var(--lm-on-surface)]">{title}</h1>
        </div>
      </div>
    </header>
  );
}
