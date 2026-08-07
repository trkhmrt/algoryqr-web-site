export const ALBA_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600&display=swap");

  .alba-menu {
    --ab-bg: #f4f7f9;
    --ab-bg-soft: #eef3f6;
    --ab-fg: #15202b;
    --ab-muted: #5f6f7d;
    --ab-border: color-mix(in srgb, #15202b 8%, transparent);
    --ab-accent: #1f6f78;
    --ab-accent-soft: #d7ecee;
    --ab-accent-fg: #ffffff;
    --ab-surface: #ffffff;
    --ab-surface-elevated: color-mix(in srgb, #ffffff 88%, #e8f0f3);
    --ab-destructive: #b42318;
    --ab-destructive-soft: color-mix(in srgb, #b42318 10%, transparent);
    --menu-frame-bg: #e8edf0;
    --menu-frame-border: color-mix(in srgb, #15202b 10%, transparent);
    --ab-glow: radial-gradient(ellipse 80% 55% at 50% -10%, #cfe8eb 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 100% 0%, #e4eef5 0%, transparent 55%),
      radial-gradient(ellipse 50% 35% at 0% 20%, #dce9e8 0%, transparent 50%);
    background-color: var(--ab-bg);
    background-image: var(--ab-glow);
    background-attachment: fixed;
    color: var(--ab-fg);
    font-family: Outfit, ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .alba-menu .font-display {
    font-family: Fraunces, ui-serif, Georgia, serif;
    letter-spacing: -0.03em;
  }

  .alba-menu .ab-fg { color: var(--ab-fg); }
  .alba-menu .ab-muted { color: var(--ab-muted); }
  .alba-menu .ab-accent { color: var(--ab-accent); }
  .alba-menu .ab-accent-bg { background-color: var(--ab-accent); }
  .alba-menu .ab-surface { background-color: var(--ab-surface); }
  .alba-menu .ab-border { border-color: var(--ab-border); }
  .alba-menu .ab-destructive { color: var(--ab-destructive); }

  .alba-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .alba-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
`;

export const ALBA_MARKS = ["◇", "○", "△", "□", "✦", "◎", "◌"] as const;

export function albaCategoryMark(index: number) {
  return ALBA_MARKS[index % ALBA_MARKS.length];
}
