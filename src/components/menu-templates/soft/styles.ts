export const SOFT_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&display=swap");

  .soft-menu {
    --sf-bg: #f7f6f3;
    --sf-bg-soft: #efeee9;
    --sf-fg: #1c1917;
    --sf-muted: #78716c;
    --sf-border: color-mix(in srgb, #1c1917 8%, transparent);
    --sf-accent: #1c1917;
    --sf-accent-soft: #e7e5e4;
    --sf-accent-fg: #fafaf9;
    --sf-surface: #ffffff;
    --sf-destructive: #b42318;
    --sf-destructive-soft: color-mix(in srgb, #b42318 10%, transparent);
    --sf-bar: #a8a29e;
    --menu-frame-bg: #ebe9e4;
    --menu-frame-border: color-mix(in srgb, #1c1917 10%, transparent);
    --menu-content-px: 1rem;
    --menu-section-gap: 0.75rem;
    background-color: var(--sf-bg);
    color: var(--sf-fg);
    font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  .soft-menu .font-display {
    font-family: Syne, ui-sans-serif, system-ui, sans-serif;
    letter-spacing: -0.03em;
  }

  .soft-menu .sf-fg { color: var(--sf-fg); }
  .soft-menu .sf-muted { color: var(--sf-muted); }
  .soft-menu .sf-accent { color: var(--sf-accent); }
  .soft-menu .sf-surface { background-color: var(--sf-surface); }
  .soft-menu .sf-border { border-color: var(--sf-border); }
  .soft-menu .sf-destructive { color: var(--sf-destructive); }

  .soft-menu .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .soft-menu .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
`;

export const SOFT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80";
