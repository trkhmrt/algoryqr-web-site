import { describe, expect, it } from "vitest";

import { draftField, draftPrice, isAiImportJobPending } from "./ai-menu-import-api";

describe("ai-menu-import-api helpers", () => {
  it("reads draft fields and price", () => {
    const draft = {
      id: "1",
      jobId: "2",
      menuId: 3,
      sourceProductId: "p1",
      approvalStatus: "WAITING_APPROVAL",
      productData: { name: "Lahmacun", price: 120, currency: "TRY" },
    };
    expect(draftField(draft, "name")).toBe("Lahmacun");
    expect(draftPrice(draft)).toBe("120");
  });

  it("detects pending job statuses", () => {
    expect(isAiImportJobPending("QUEUED")).toBe(true);
    expect(isAiImportJobPending("EXTRACTING")).toBe(true);
    expect(isAiImportJobPending("BATCH_SUBMITTED")).toBe(true);
    expect(isAiImportJobPending("WAITING_APPROVAL")).toBe(false);
    expect(isAiImportJobPending("FAILED")).toBe(false);
  });
});
