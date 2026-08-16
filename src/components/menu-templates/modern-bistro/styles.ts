import { ALGORY_MENU_FONT_FACE, ALGORY_MENU_SANS } from "@/components/menu-templates/shared/algory-fonts";

export const MODERN_BISTRO_STYLES = `
  ${ALGORY_MENU_FONT_FACE}

  .modern-bistro-menu {
    --mb-bg: #fafafa;
    --mb-surface: #ffffff;
    --mb-fg: #111111;
    --mb-muted: #6b7280;
    --mb-border: #e5e7eb;
    --mb-primary: #111111;
    --mb-primary-fg: #ffffff;
    --mb-accent: #16a34a;
    --mb-accent-soft: #dcfce7;
    --mb-destructive: #ef4444;
    --mb-font: ${ALGORY_MENU_SANS};
    --mb-shadow: 0 20px 48px -14px rgba(0, 0, 0, 0.12);

    background-color: var(--mb-bg);
    color: var(--mb-fg);
    font-family: var(--mb-font);
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .modern-bistro-menu .mb-bg { background-color: var(--mb-bg); }
  .modern-bistro-menu .mb-surface { background-color: var(--mb-surface); }
  .modern-bistro-menu .mb-fg { color: var(--mb-fg); }
  .modern-bistro-menu .mb-muted { color: var(--mb-muted); }
  .modern-bistro-menu .mb-border { border-color: var(--mb-border); }
  .modern-bistro-menu .mb-accent { color: var(--mb-accent); }

  .modern-bistro-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .modern-bistro-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .modern-bistro-menu .bg-background { background-color: var(--mb-bg); }
  .modern-bistro-menu .bg-card { background-color: var(--mb-surface); }
  .modern-bistro-menu .bg-muted { background-color: #f3f4f6; }
  .modern-bistro-menu .text-foreground { color: var(--mb-fg); }
  .modern-bistro-menu .text-muted-foreground { color: var(--mb-muted); }
  .modern-bistro-menu .text-destructive { color: var(--mb-destructive); }
  .modern-bistro-menu .border-border { border-color: var(--mb-border); }
  .modern-bistro-menu .bg-foreground { background-color: var(--mb-primary); color: var(--mb-primary-fg); }
  .modern-bistro-menu .text-background { color: var(--mb-primary-fg); }
`;

export const MODERN_BISTRO_HERO_IMAGE = "/menu-templates/modern-bistro/hero.svg";

export const MODERN_BISTRO_CATEGORY_MARKS = [
  "🔥",
  "☕",
  "🍔",
  "🍟",
  "🥤",
  "🍰",
  "🥗",
  "🍕",
  "🌮",
] as const;

export function modernBistroCategoryMark(index: number) {
  return MODERN_BISTRO_CATEGORY_MARKS[index % MODERN_BISTRO_CATEGORY_MARKS.length];
}
