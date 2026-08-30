import { describe, expect, it } from "vitest";

import { openQueueDateRange, todayDateRange } from "./date-range-filter";

describe("date range presets", () => {
  it("opens the queue with an empty range", () => {
    expect(openQueueDateRange()).toEqual({ from: "", to: "" });
  });

  it("keeps today as a local same-day range", () => {
    const range = todayDateRange();
    expect(range.from).toBe(range.to);
    expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
