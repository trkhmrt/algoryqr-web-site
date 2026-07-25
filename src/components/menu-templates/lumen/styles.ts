export const LUMEN_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap");

  .lumen-menu {
    --ln-bg: oklch(0.16 0.012 60);
    --ln-fg: oklch(0.96 0.01 80);
    --ln-card: oklch(0.20 0.014 60);
    --ln-muted: oklch(0.70 0.02 70);
    --ln-border: oklch(0.30 0.014 60 / 60%);
    --ln-gold: oklch(0.82 0.14 78);
    --ln-gold-soft: oklch(0.72 0.11 70);
    --ln-primary-fg: oklch(0.16 0.012 60);
    --ln-destructive: oklch(0.60 0.22 25);
    --ln-destructive-fg: oklch(0.98 0 0);
    --ln-gradient-gold: linear-gradient(135deg, oklch(0.85 0.14 82), oklch(0.68 0.12 55));
    background-color: var(--ln-bg);
    color: var(--ln-fg);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .lumen-menu .font-display {
    font-family: "Playfair Display", ui-serif, Georgia, serif;
    letter-spacing: -0.02em;
  }

  .lumen-menu .text-gradient-gold {
    background-image: var(--ln-gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lumen-menu .bg-gradient-gold {
    background-image: var(--ln-gradient-gold);
  }

  .lumen-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .lumen-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .lumen-menu .ln-bg { background-color: var(--ln-bg); }
  .lumen-menu .ln-fg { color: var(--ln-fg); }
  .lumen-menu .ln-muted { color: var(--ln-muted); }
  .lumen-menu .ln-gold { color: var(--ln-gold); }
  .lumen-menu .ln-gold-bg { background-color: var(--ln-gold); }
  .lumen-menu .ln-card-bg { background-color: var(--ln-card); }
  .lumen-menu .ln-border { border-color: var(--ln-border); }
  .lumen-menu .ln-destructive { color: var(--ln-destructive); }
`;

export const LUMEN_HERO_IMAGE = "/menu-templates/lumen/hero.jpg";

export const LUMEN_CATEGORY_EMOJIS = ["◐", "◆", "◇", "◈", "❋", "✦", "◉"] as const;

export function lumenCategoryEmoji(index: number) {
  return LUMEN_CATEGORY_EMOJIS[index % LUMEN_CATEGORY_EMOJIS.length];
}
