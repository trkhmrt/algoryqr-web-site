import { describe, expect, it } from "vitest";

import {
  SMART_REPORT_POLL_INTERVAL_MS,
  findLatestSmartReportForScope,
  isSmartReportPending,
  isSmartReportQuotaExhausted,
  matchesSmartReportScope,
  normalizeSmartReportResult,
  resolveSmartReportProcessId,
  smartReportStatusLabel,
  smartReportTitle,
  toSmartReportUiStatus,
  type SmartReportListItem,
} from "./smart-report";

function listItem(
  overrides: Partial<SmartReportListItem> & Pick<SmartReportListItem, "jobId" | "from" | "to" | "createdAt">,
): SmartReportListItem {
  return {
    menuId: null,
    menuName: null,
    branchId: null,
    branchName: null,
    status: "completed",
    ...overrides,
  };
}

describe("smart-report helpers", () => {
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
    expect(smartReportStatusLabel("queued")).toBe("Hazırlanıyor");
    expect(smartReportStatusLabel("processing")).toBe("Hazırlanıyor");
    expect(smartReportStatusLabel("completed")).toBe("Hazır");
    expect(smartReportStatusLabel("failed")).toBe("Başarısız");
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
    expect(
      isSmartReportQuotaExhausted({
        period: "WEEK",
        limit: 1,
        used: 0,
        remaining: 1,
        resetsAt: "2026-08-10T00:00:00+03:00",
        lastUsage: "2026-08-09T12:00:00+03:00",
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

  it("matches and picks the latest job for a branch date range from the API list", () => {
    const scope = {
      branchId: 3,
      menuId: null,
      from: "2026-07-01",
      to: "2026-08-01",
    };
    const newer = listItem({
      jobId: "11111111-1111-1111-1111-111111111111",
      branchId: 3,
      from: "2026-07-01",
      to: "2026-08-01",
      status: "queued",
      createdAt: "2026-08-02T10:00:00Z",
    });
    const older = listItem({
      jobId: "22222222-2222-2222-2222-222222222222",
      branchId: 3,
      from: "2026-07-01",
      to: "2026-08-01",
      status: "completed",
      createdAt: "2026-08-01T10:00:00Z",
    });
    const otherBranch = listItem({
      jobId: "33333333-3333-3333-3333-333333333333",
      branchId: 9,
      from: "2026-07-01",
      to: "2026-08-01",
      status: "queued",
      createdAt: "2026-08-03T10:00:00Z",
    });

    expect(matchesSmartReportScope(newer, scope)).toBe(true);
    expect(matchesSmartReportScope(otherBranch, scope)).toBe(false);
    expect(findLatestSmartReportForScope([newer, older, otherBranch], scope)).toEqual(newer);
    expect(findLatestSmartReportForScope([otherBranch], scope)).toBeNull();
  });

  it("prefers menu scope over branch when menuId is set", () => {
    const scope = {
      branchId: 3,
      menuId: 9,
      from: "2026-07-01",
      to: "2026-08-01",
    };
    const menuJob = listItem({
      jobId: "44444444-4444-4444-4444-444444444444",
      branchId: 3,
      menuId: 9,
      from: "2026-07-01",
      to: "2026-08-01",
      createdAt: "2026-08-02T10:00:00Z",
    });
    const branchOnly = listItem({
      jobId: "55555555-5555-5555-5555-555555555555",
      branchId: 3,
      menuId: null,
      from: "2026-07-01",
      to: "2026-08-01",
      createdAt: "2026-08-03T10:00:00Z",
    });
    expect(matchesSmartReportScope(menuJob, scope)).toBe(true);
    expect(matchesSmartReportScope(branchOnly, scope)).toBe(false);
    expect(findLatestSmartReportForScope([branchOnly, menuJob], scope)).toEqual(menuJob);
  });

  it("prefers branchName over menuName for titles", () => {
    expect(smartReportTitle({ branchName: "Kadikoy", menuName: "Aksam" })).toBe("Kadikoy");
    expect(smartReportTitle({ branchName: null, menuName: "Aksam" })).toBe("Aksam");
  });
});
