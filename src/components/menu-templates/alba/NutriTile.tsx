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
          ? "border-[color-mix(in_srgb,var(--ab-accent)_25%,transparent)] bg-[var(--ab-accent-soft)]"
          : "border-[var(--ab-border)] bg-[var(--ab-surface)]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] ab-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-display text-2xl font-semibold ${
            accent ? "ab-accent" : "ab-fg"
          }`}
        >
          {value}
        </span>
        <span className="text-xs ab-muted">{unit}</span>
      </div>
    </div>
  );
}
