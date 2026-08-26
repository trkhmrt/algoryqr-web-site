export const MAISON_NOIR_FONT_FACE = `
  @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400&display=swap");
`;

export const MAISON_NOIR_DISPLAY = '"Cormorant Garamond", "Didot", Georgia, serif';
export const MAISON_NOIR_SANS = '"Jost", "Helvetica Neue", sans-serif';

export const MAISON_NOIR_STYLES = `
  ${MAISON_NOIR_FONT_FACE}

  .maison-noir-menu {
    --mn-bg: oklch(0.14 0.004 60);
    --mn-fg: oklch(0.93 0.008 80);
    --mn-surface: oklch(0.17 0.005 60);
    --mn-muted: oklch(0.66 0.012 80);
    --mn-border: oklch(0.32 0.012 80 / 45%);
    --mn-primary: oklch(0.78 0.09 84);
    --mn-primary-fg: oklch(0.14 0.004 60);
    --mn-gold: oklch(0.78 0.09 84);
    --mn-gold-soft: oklch(0.88 0.06 88);
    --mn-destructive: oklch(0.58 0.2 27);
    --mn-font: ${MAISON_NOIR_SANS};
    --mn-display: ${MAISON_NOIR_DISPLAY};
    --mn-veil: linear-gradient(
      to top,
      oklch(0.14 0.004 60) 6%,
      oklch(0.14 0.004 60 / 0.75) 42%,
      oklch(0.14 0.004 60 / 0.15) 100%
    );
    --mn-rule: linear-gradient(to right, transparent, var(--mn-gold) 50%, transparent);
    --mn-shadow: 0 20px 48px -14px oklch(0 0 0 / 0.45);

    --lx-bg: var(--mn-bg);
    --lx-fg: var(--mn-fg);
    --lx-card: var(--mn-surface);
    --lx-card-fg: var(--mn-fg);
    --lx-card-muted: oklch(0.93 0.008 80 / 0.62);
    --lx-muted: var(--mn-muted);
    --lx-border: var(--mn-border);
    --lx-gold: var(--mn-gold);
    --lx-gold-soft: var(--mn-gold-soft);
    --lx-primary-fg: var(--mn-primary-fg);
    --lx-destructive: var(--mn-destructive);
    --lx-destructive-fg: var(--mn-fg);
    --lx-gradient-gold: linear-gradient(135deg, var(--mn-gold), var(--mn-gold-soft));
    --menu-frame-bg: var(--mn-bg);
    --menu-frame-border: var(--mn-border);

    background-color: var(--mn-bg);
    color: var(--mn-fg);
    font-family: var(--mn-font);
    font-weight: 300;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .maison-noir-menu .font-display {
    font-family: var(--mn-display);
    font-weight: 300;
    letter-spacing: -0.02em;
  }

  .maison-noir-menu .mn-veil {
    background-image: var(--mn-veil);
  }

  .maison-noir-menu .mn-hairline {
    height: 1px;
    background-image: var(--mn-rule);
    opacity: 0.55;
  }

  .maison-noir-menu .mn-tracked {
    letter-spacing: 0.42em;
    text-transform: uppercase;
  }

  .maison-noir-menu .mn-rise {
    animation: mn-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes mn-rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .maison-noir-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .maison-noir-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .maison-noir-menu .text-muted-foreground { color: var(--mn-muted); }
  .maison-noir-menu .text-foreground { color: var(--mn-fg); }
  .maison-noir-menu .text-destructive { color: var(--mn-destructive); }
  .maison-noir-menu .bg-background { background-color: var(--mn-bg); }
  .maison-noir-menu .bg-card { background-color: var(--mn-surface); }
  .maison-noir-menu .bg-muted { background-color: oklch(0.22 0.006 70); }
  .maison-noir-menu .bg-foreground { background-color: var(--mn-primary); color: var(--mn-primary-fg); }
  .maison-noir-menu .text-background { color: var(--mn-primary-fg); }
  .maison-noir-menu .border-border { border-color: var(--mn-border); }
  .maison-noir-menu .text-gradient-gold {
    background-image: var(--lx-gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .maison-noir-menu .bg-gradient-gold {
    background-image: var(--lx-gradient-gold);
  }
`;

export const MAISON_NOIR_HERO_IMAGE = "/menu-templates/maison-noir/hero.jpg";

export const MAISON_NOIR_CATEGORY_MARKS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

export function maisonNoirCategoryMark(index: number) {
  return MAISON_NOIR_CATEGORY_MARKS[index % MAISON_NOIR_CATEGORY_MARKS.length];
}

export function maisonNoirMonogram(businessName: string) {
  const parts = businessName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
