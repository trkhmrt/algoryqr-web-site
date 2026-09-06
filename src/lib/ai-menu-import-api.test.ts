import { describe, expect, it } from "vitest";

import { isAiImportJobCompleted, isAiImportJobPending } from "./ai-menu-import-api";

describe("ai-menu-import-api helpers", () => {
  it("detects pending job statuses", () => {
    expect(isAiImportJobPending("queued")).toBe(true);
    expect(isAiImportJobPending("processing")).toBe(true);
    expect(isAiImportJobPending("waiting_batch")).toBe(true);
    expect(isAiImportJobPending("publishing")).toBe(true);
    expect(isAiImportJobPending("completed")).toBe(false);
    expect(isAiImportJobPending("failed")).toBe(false);
  });

  it("detects completed status", () => {
    expect(isAiImportJobCompleted("completed")).toBe(true);
    expect(isAiImportJobCompleted("failed")).toBe(false);
  });
});
