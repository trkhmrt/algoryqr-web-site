export const PETITE_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Nunito:wght@400;500;600;700&display=swap");

  .petite-menu {
    --lx-bg: #F9F6EE;
    --lx-fg: #4E7B6C;
    --lx-card: #FFFdf8;
    --lx-muted: color-mix(in srgb, #4E7B6C 62%, #F9F6EE);
    --lx-border: #BCE3C5;
    --lx-gold: #4E7B6C;
    --lx-gold-soft: #C8B1E0;
    --lx-primary-fg: #F9F6EE;
    --lx-destructive: #b4534a;
    --lx-destructive-fg: #F9F6EE;
    --menu-frame-bg: #F9F6EE;
    --menu-frame-border: #BCE3C5;
    --lx-lavender: #C8B1E0;
    --lx-mint-light: #BCE3C5;
    --lx-gradient-gold: linear-gradient(135deg, #4E7B6C, #C8B1E0);
    background-color: var(--lx-bg);
    color: var(--lx-fg);
    font-family: Nunito, ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .petite-menu .font-display {
    font-family: "Cormorant Garamond", ui-serif, Georgia, serif;
    letter-spacing: -0.01em;
    font-style: italic;
  }

  .petite-menu .text-gradient-gold {
    background-image: var(--lx-gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .petite-menu .bg-gradient-gold {
    background-image: var(--lx-gradient-gold);
  }

  .petite-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .petite-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .petite-menu .lx-bg { background-color: var(--lx-bg); }
  .petite-menu .lx-fg { color: var(--lx-fg); }
  .petite-menu .lx-muted { color: var(--lx-muted); }
  .petite-menu .lx-gold { color: var(--lx-gold); }
  .petite-menu .lx-gold-bg { background-color: var(--lx-gold); }
  .petite-menu .lx-card-bg { background-color: var(--lx-card); }
  .petite-menu .lx-border { border-color: var(--lx-border); }
  .petite-menu .lx-destructive { color: var(--lx-destructive); }

  .petite-menu .text-muted-foreground { color: var(--lx-muted); }
  .petite-menu .text-foreground { color: var(--lx-fg); }
  .petite-menu .text-destructive { color: var(--lx-destructive); }
  .petite-menu .bg-background { background-color: var(--lx-card); }
  .petite-menu .bg-card { background-color: var(--lx-card); }
  .petite-menu .bg-muted { background-color: color-mix(in srgb, #BCE3C5 35%, #F9F6EE); }
  .petite-menu .bg-foreground { background-color: var(--lx-gold); color: var(--lx-primary-fg); }
  .petite-menu .text-background { color: var(--lx-primary-fg); }
  .petite-menu .border-border { border-color: var(--lx-border); }

  .petite-menu input,
  .petite-menu textarea,
  .petite-menu select {
    color: var(--lx-fg);
    background-color: #ffffff;
    border-color: var(--lx-border);
  }
  .petite-menu input::placeholder,
  .petite-menu textarea::placeholder {
    color: var(--lx-muted);
  }

  .petite-menu .menu-footer {
    background-color: color-mix(in srgb, #F9F6EE 88%, #BCE3C5);
  }

  .petite-menu header {
    background-color: color-mix(in srgb, #F9F6EE 86%, transparent);
  }
`;

export const PETITE_HERO_IMAGE = "/menu-templates/petite-patisserie/hero.svg";
export const PETITE_PANEL_BG = "/menu-templates/petite-patisserie/hero.svg";

export const PETITE_CATEGORY_MARKS = ["🥐", "🍰", "☕", "🧁", "🍓", "🌸", "🍵"] as const;
