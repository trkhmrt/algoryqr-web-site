type NutriTileProps = {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
};

export function NutriTile({ label, value, unit, accent }: NutriTileProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-[color-mix(in_oklch,var(--ln-gold)_40%,transparent)] bg-[color-mix(in_oklch,var(--ln-gold)_10%,transparent)]"
          : "border-[var(--ln-border)] bg-[color-mix(in_oklch,var(--ln-card)_60%,transparent)]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest ln-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-display text-2xl font-semibold ${
            accent ? "text-gradient-gold" : "ln-fg"
          }`}
        >
          {value}
        </span>
        <span className="text-xs ln-muted">{unit}</span>
      </div>
    </div>
  );
}
