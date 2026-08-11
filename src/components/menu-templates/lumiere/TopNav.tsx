type TopNavProps = {
  businessName: string;
  logoUrl?: string | null;
  variant?: "home" | "detail";
  onBack?: () => void;
  onHome?: () => void;
};

export function LumiereTopNav({
  businessName,
  logoUrl,
  variant = "home",
  onBack,
  onHome,
}: TopNavProps) {
  const title = businessName.trim() || "Menü";

  if (variant === "detail") {
    return (
      <header className="fixed left-0 right-0 top-0 z-50 mx-auto max-w-md border-b border-[var(--lm-outline-variant)] bg-[color-mix(in_srgb,var(--lm-surface)_88%,transparent)] backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-[var(--lm-on-surface-variant)]"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="lm-headline-md truncate text-[var(--lm-on-surface)]">{title}</h1>
          <div className="w-6" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--lm-outline-variant)] bg-[var(--lm-surface)]">
      <div className="flex h-14 items-center px-4">
        <button
          type="button"
          onClick={onHome}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          {logoUrl?.trim() ? (
            <img
              src={logoUrl.trim()}
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg object-contain ring-1 ring-[var(--lm-outline-variant)]"
            />
          ) : (
            <span className="material-symbols-outlined text-[var(--lm-primary)]">
              restaurant_menu
            </span>
          )}
          <h1 className="lm-headline-md truncate text-[var(--lm-on-surface)]">{title}</h1>
        </button>
      </div>
    </header>
  );
}
