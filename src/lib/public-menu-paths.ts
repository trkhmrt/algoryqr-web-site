export function publicMenuPath(identifier: number | string) {
  return `/menu/${identifier}/content`;
}

export function publicMenuContentPath(identifier: number | string) {
  return `/menu/${identifier}/content`;
}

export type PublicMenuLandingPanel = "landing" | "reservation" | "feedback" | "contact";

export function parsePublicMenuPanel(value: string | null | undefined): PublicMenuLandingPanel {
  if (value === "reservation" || value === "feedback" || value === "contact") {
    return value;
  }
  return "landing";
}
