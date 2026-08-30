export const DASHBOARD_SURFACE =
  "rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card";

export const DASHBOARD_TILE =
  `${DASHBOARD_SURFACE} p-4 transition-colors hover:bg-muted/50`;

export const DASHBOARD_TILE_SQUARE =
  "group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none transition-colors hover:bg-muted/50 dark:border-border dark:bg-card";

export const DASHBOARD_TILE_ROW =
  `${DASHBOARD_TILE} group flex items-center gap-3 text-left`;

export const DASHBOARD_PANEL = `${DASHBOARD_SURFACE} p-4 sm:p-5`;

export const DASHBOARD_PANEL_LG = `${DASHBOARD_SURFACE} p-6`;

export const DASHBOARD_LIST_ITEM =
  `${DASHBOARD_SURFACE} p-4 transition-colors hover:bg-muted/50`;

export const DASHBOARD_FILTER_BAR =
  `${DASHBOARD_SURFACE} flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5`;

export const DASHBOARD_STAT_TILE =
  `${DASHBOARD_SURFACE} p-3 text-left transition-colors hover:bg-muted/50`;

export const DASHBOARD_ICON_WELL =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-lg font-medium text-muted-foreground";

export const DASHBOARD_BACK =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export const DASHBOARD_HUB_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4";

export const DASHBOARD_TYPE_TITLE = "text-2xl font-semibold tracking-tight text-foreground";
export const DASHBOARD_TYPE_SECTION = "text-base font-semibold text-foreground";
export const DASHBOARD_TYPE_HINT = "text-sm text-muted-foreground";
export const DASHBOARD_TYPE_TILE = "text-sm font-medium text-foreground";
export const DASHBOARD_TYPE_META = "text-xs text-muted-foreground";
export const DASHBOARD_TYPE_KPI = "text-3xl font-semibold tracking-tight text-foreground";
