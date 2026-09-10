import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SMART_REPORT_POLL_INTERVAL_MS,
  clearStoredSmartReportJob,
  isLastUsageWithinQuotaPeriod,
  isSmartReportPending,
  isSmartReportQuotaExhausted,
  normalizeSmartReportResult,
  readStoredSmartReportJob,
  resolveSmartReportProcessId,
  smartReportScopeKey,
  smartReportStorageKey,
  smartReportTitle,
  toSmartReportUiStatus,
  writeStoredSmartReportJob,
} from "./smart-report";

describe("smart-report helpers", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses a 5 second poll interval", () => {
    expect(SMART_REPORT_POLL_INTERVAL_MS).toBe(5_000);
  });

  it("resolves processId preferentially over jobId", () => {
    expect(
      resolveSmartReportProcessId({
        processId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        jobId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
    ).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(
      resolveSmartReportProcessId({
        jobId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
    ).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(resolveSmartReportProcessId({})).toBeNull();
  });

  it("maps job statuses to UI statuses", () => {
    expect(toSmartReportUiStatus(undefined)).toBe("idle");
    expect(toSmartReportUiStatus("queued")).toBe("pending");
    expect(toSmartReportUiStatus("processing")).toBe("pending");
    expect(toSmartReportUiStatus("running")).toBe("pending");
    expect(toSmartReportUiStatus("completed")).toBe("ready");
    expect(toSmartReportUiStatus("failed")).toBe("failed");
    expect(isSmartReportPending("queued")).toBe(true);
    expect(isSmartReportPending("processing")).toBe(true);
    expect(isSmartReportPending("completed")).toBe(false);
  });

  it("detects lastUsage inside the day period", () => {
    const now = new Date("2026-08-02T12:00:00+03:00");
    expect(
      isLastUsageWithinQuotaPeriod("2026-08-02T09:15:00+03:00", "DAY", now),
    ).toBe(true);
    expect(
      isLastUsageWithinQuotaPeriod("2026-08-01T23:59:00+03:00", "DAY", now),
    ).toBe(false);
  });

  it("treats free remaining zero as exhausted unless paid credits remain", () => {
    expect(
      isSmartReportQuotaExhausted({
        period: "WEEK",
        limit: 1,
        used: 1,
        remaining: 0,
        resetsAt: "2026-08-10T00:00:00+03:00",
      }),
    ).toBe(true);
    expect(
      isSmartReportQuotaExhausted({
        period: "WEEK",
        limit: 1,
        used: 1,
        remaining: 0,
        resetsAt: "2026-08-10T00:00:00+03:00",
        paidCredits: 2,
      }),
    ).toBe(false);
  });

  it("normalizes result_text into a SmartReportResult", () => {
    expect(
      normalizeSmartReportResult({
        resultText: "## Baslik\n\nGovde",
      }),
    ).toEqual({
      title: "Akilli Rapor",
      summary: "## Baslik\n\nGovde",
      sections: [],
      rawMarkdown: "## Baslik\n\nGovde",
    });
  });

  it("persists and restores job by scope and date range", () => {
    expect(smartReportScopeKey(3, null)).toBe("branch:3");
    expect(smartReportScopeKey(3, 9)).toBe("menu:9");
    const key = smartReportStorageKey("menu:1", "2026-07-01", "2026-08-01");
    expect(key).toBe("smart-report:menu:1:2026-07-01:2026-08-01");

    writeStoredSmartReportJob("branch:3", "2026-07-01", "2026-08-01", {
      jobId: "281f830b-ec6c-4fa6-b6e1-04d8c66f1549",
      status: "queued",
      savedAt: 1,
    });

    expect(readStoredSmartReportJob("branch:3", "2026-07-01", "2026-08-01")).toEqual({
      jobId: "281f830b-ec6c-4fa6-b6e1-04d8c66f1549",
      status: "queued",
      savedAt: 1,
    });

    clearStoredSmartReportJob("branch:3", "2026-07-01", "2026-08-01");
    expect(readStoredSmartReportJob("branch:3", "2026-07-01", "2026-08-01")).toBeNull();
  });

  it("prefers branchName over menuName for titles", () => {
    expect(smartReportTitle({ branchName: "Kadikoy", menuName: "Aksam" })).toBe("Kadikoy");
    expect(smartReportTitle({ branchName: null, menuName: "Aksam" })).toBe("Aksam");
  });
});
