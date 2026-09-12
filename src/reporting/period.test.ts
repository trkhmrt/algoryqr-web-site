import { describe, expect, it } from "vitest";

import { comparePeriodRange, eachIsoDate, formatReportingDate, parseIsoDate } from "./period";

describe("comparePeriodRange", () => {
  it("shiftsTheWindowByOneWeek", () => {
    expect(comparePeriodRange("2026-09-06", "2026-09-12", "week")).toEqual({
      from: "2026-08-30",
      to: "2026-09-05",
    });
  });

  it("shiftsASingleDayByOneWeek", () => {
    expect(comparePeriodRange("2026-09-12", "2026-09-12", "week")).toEqual({
      from: "2026-09-05",
      to: "2026-09-05",
    });
  });

  it("shiftsTheWindowByOneYear", () => {
    expect(comparePeriodRange("2026-09-06", "2026-09-12", "year")).toEqual({
      from: "2025-09-06",
      to: "2025-09-12",
    });
  });

  it("usesTheImmediatelyPreviousEqualWindow", () => {
    expect(comparePeriodRange("2026-08-14", "2026-09-12", "previous")).toEqual({
      from: "2026-07-15",
      to: "2026-08-13",
    });
  });

  it("mapsASingleDayPreviousWindowToTheDayBefore", () => {
    expect(comparePeriodRange("2026-09-12", "2026-09-12", "previous")).toEqual({
      from: "2026-09-11",
      to: "2026-09-11",
    });
  });
});

describe("eachIsoDate", () => {
  it("listsInclusiveLocalDates", () => {
    expect(eachIsoDate("2026-09-10", "2026-09-12")).toEqual([
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ]);
  });

  it("returnsEmptyWhenRangeIsInvalid", () => {
    expect(eachIsoDate("2026-09-12", "2026-09-10")).toEqual([]);
    expect(eachIsoDate("nope", "2026-09-12")).toEqual([]);
  });
});

describe("parseIsoDate", () => {
  it("rejectsImpossibleCalendarDays", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-09-12")?.getDate()).toBe(12);
  });
});

describe("formatReportingDate", () => {
  it("keepsInvalidInputAsIs", () => {
    expect(formatReportingDate("not-a-date")).toBe("not-a-date");
  });
});
