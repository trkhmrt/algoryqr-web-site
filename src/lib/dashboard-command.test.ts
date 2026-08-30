import { describe, expect, it } from "vitest";

import { filterCommandEntries, getDashboardCommandEntries } from "./dashboard-command";

describe("filterCommandEntries", () => {
  const entries = getDashboardCommandEntries();

  it("hides scoped pages the user cannot open", () => {
    const visible = filterCommandEntries(entries, "", (scope) => !scope);
    expect(visible.every((entry) => !entry.requiredScope)).toBe(true);
    expect(visible.some((entry) => entry.id === "overview")).toBe(true);
  });

  it("matches Turkish keywords", () => {
    const visible = filterCommandEntries(entries, "rezerv", () => true);
    expect(visible.map((entry) => entry.id)).toContain("reservations");
  });
});
