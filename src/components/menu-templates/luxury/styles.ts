import { ALGORY_MENU_FONT_FACE, ALGORY_MENU_SANS } from "@/components/menu-templates/shared/algory-fonts";

export const LUXURY_STYLES = `
  ${ALGORY_MENU_FONT_FACE}

  .luxury-menu {
    --lx-bg: #D4CFC4;
    --lx-fg: #140814;
    --lx-card: #2C1E2B;
    --lx-card-fg: #F5F5F5;
    --lx-card-muted: rgba(245, 245, 245, 0.62);
    --lx-muted: #615e55;
    --lx-border: rgba(44, 30, 43, 0.14);
    --lx-gold: #C29B38;
    --lx-gold-soft: #9a7520;
    --lx-primary-fg: #140814;
    --lx-destructive: #ba1a1a;
    --lx-destructive-fg: #ffffff;
    --menu-frame-bg: #D4CFC4;
    --menu-frame-border: rgba(44, 30, 43, 0.18);
    --lx-gradient-gold: linear-gradient(135deg, #C29B38, #8B6A18);
    --lx-chip: rgba(20, 8, 20, 0.72);
    background-color: var(--lx-bg);
    color: var(--lx-fg);
    font-family: ${ALGORY_MENU_SANS};
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .luxury-menu .font-display {
    font-family: ${ALGORY_MENU_SANS};
    letter-spacing: -0.035em;
    font-weight: 700;
  }

  .luxury-menu .text-gradient-gold {
    background-image: var(--lx-gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .luxury-menu .bg-gradient-gold {
    background-image: var(--lx-gradient-gold);
  }

  .luxury-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .luxury-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .luxury-menu .lx-bg { background-color: var(--lx-bg); }
  .luxury-menu .lx-fg { color: var(--lx-fg); }
  .luxury-menu .lx-muted { color: var(--lx-muted); }
  .luxury-menu .lx-card-fg { color: var(--lx-card-fg); }
  .luxury-menu .lx-card-muted { color: var(--lx-card-muted); }
  .luxury-menu .lx-gold { color: var(--lx-gold); }
  .luxury-menu .lx-gold-bg { background-color: var(--lx-gold); }
  .luxury-menu .lx-card-bg { background-color: var(--lx-card); }
  .luxury-menu .lx-border { border-color: var(--lx-border); }
  .luxury-menu .lx-destructive { color: var(--lx-destructive); }

  .luxury-menu .text-muted-foreground { color: var(--lx-muted); }
  .luxury-menu .text-foreground { color: var(--lx-fg); }
  .luxury-menu .text-destructive { color: var(--lx-destructive); }
  .luxury-menu .bg-background { background-color: var(--lx-card); }
  .luxury-menu .bg-card { background-color: var(--lx-card); }
  .luxury-menu .bg-muted { background-color: color-mix(in srgb, var(--lx-card) 80%, var(--lx-bg) 20%); }
  .luxury-menu .bg-foreground { background-color: var(--lx-gold); color: var(--lx-primary-fg); }
  .luxury-menu .text-background { color: var(--lx-primary-fg); }
  .luxury-menu .border-border { border-color: var(--lx-border); }

  .luxury-menu .menu-footer {
    background-color: color-mix(in srgb, var(--lx-bg) 90%, #000 10%);
  }

  .luxury-menu input,
  .luxury-menu textarea,
  .luxury-menu select {
    color: var(--lx-fg);
    background-color: color-mix(in srgb, var(--lx-bg) 80%, transparent);
    border-color: var(--lx-border);
  }
  .luxury-menu input::placeholder,
  .luxury-menu textarea::placeholder {
    color: var(--lx-muted);
  }
  .luxury-menu input[type="date"]::-webkit-calendar-picker-indicator,
  .luxury-menu input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(0);
  }
`;

export const LUXURY_HERO_IMAGE = "/menu-templates/luxury/reservation-bg.png";
export const LUXURY_RESERVATION_BG = "/menu-templates/luxury/reservation-bg.png";
export const LUXURY_CONTACT_BG = "/menu-templates/luxury/contact-bg.png";
export const LUXURY_FEEDBACK_BG = "/menu-templates/luxury/feedback-bg.png";

export const LUXURY_CATEGORY_EMOJIS = ["◐", "◆", "◇", "◈", "❋", "✦", "◉"] as const;

export function luxuryCategoryEmoji(index: number) {
  return LUXURY_CATEGORY_EMOJIS[index % LUXURY_CATEGORY_EMOJIS.length];
}
