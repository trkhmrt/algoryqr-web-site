import { ALGORY_MENU_FONT_FACE, ALGORY_MENU_SANS } from "@/components/menu-templates/shared/algory-fonts";

export const LUCITE_STYLES = `
  ${ALGORY_MENU_FONT_FACE}

  .lucite-menu {
    --lx-bg: #D6D4D0;
    --lx-fg: #1C1C1C;
    --lx-card: #ECEBE8;
    --lx-muted: #6B6A67;
    --lx-border: #C4C2BD;
    --lx-gold: #B08D57;
    --lx-gold-soft: #8C7044;
    --lx-primary-fg: #F7F4EE;
    --lx-destructive: #8B3A32;
    --lx-destructive-fg: #F7F4EE;
    --menu-frame-bg: #D6D4D0;
    --menu-frame-border: #C4C2BD;
    --lx-gradient-gold: linear-gradient(135deg, #C9A66B, #8C7044);
    background-color: var(--lx-bg);
    color: var(--lx-fg);
    font-family: ${ALGORY_MENU_SANS};
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .lucite-menu .font-display {
    font-family: ${ALGORY_MENU_SANS};
    font-weight: 700;
    letter-spacing: -0.035em;
  }

  .lucite-menu .text-gradient-gold {
    background-image: var(--lx-gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lucite-menu .bg-gradient-gold {
    background-image: var(--lx-gradient-gold);
  }

  .lucite-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .lucite-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .lucite-menu .lx-bg { background-color: var(--lx-bg); }
  .lucite-menu .lx-fg { color: var(--lx-fg); }
  .lucite-menu .lx-muted { color: var(--lx-muted); }
  .lucite-menu .lx-gold { color: var(--lx-gold); }
  .lucite-menu .lx-gold-bg { background-color: var(--lx-gold); }
  .lucite-menu .lx-card-bg { background-color: var(--lx-card); }
  .lucite-menu .lx-border { border-color: var(--lx-border); }
  .lucite-menu .lx-destructive { color: var(--lx-destructive); }

  .lucite-menu .text-muted-foreground { color: var(--lx-muted); }
  .lucite-menu .text-foreground { color: var(--lx-fg); }
  .lucite-menu .text-destructive { color: var(--lx-destructive); }
  .lucite-menu .bg-background { background-color: var(--lx-card); }
  .lucite-menu .bg-card { background-color: var(--lx-card); }
  .lucite-menu .bg-muted { background-color: #C9C7C2; }
  .lucite-menu .bg-foreground { background-color: var(--lx-gold); color: var(--lx-primary-fg); }
  .lucite-menu .text-background { color: var(--lx-primary-fg); }
  .lucite-menu .border-border { border-color: var(--lx-border); }

  .lucite-menu input,
  .lucite-menu textarea,
  .lucite-menu select {
    color: var(--lx-fg);
    background-color: #F3F2EF;
    border-color: var(--lx-border);
  }
  .lucite-menu input::placeholder,
  .lucite-menu textarea::placeholder {
    color: var(--lx-muted);
  }

  .lucite-menu .menu-footer {
    background-color: #C9C7C2;
  }

  .lucite-menu header {
    background-color: color-mix(in srgb, #ECEBE8 88%, transparent);
  }
`;

export const LUCITE_HERO_IMAGE = "/menu-templates/lucite-gris/hero.svg";
export const LUCITE_PANEL_BG = "/menu-templates/lucite-gris/hero.svg";
export const LUCITE_CATEGORY_MARKS = ["◇", "□", "·", "—", "○", "▣", "◦"] as const;
