import { describe, expect, it } from "vitest";

import { ackPrintJob, enqueuePrintJob } from "./printer-jobs";
import { DEFAULT_PRINTER_SETTINGS, type PrinterAccount } from "./printer-store";

function account(): PrinterAccount {
  return {
    userId: 7,
    settings: { ...DEFAULT_PRINTER_SETTINGS, sources: [...DEFAULT_PRINTER_SETTINGS.sources] },
    printedKeys: [],
    jobs: [],
  };
}

describe("printer jobs", () => {
  it("dedupes pending jobs unless forced", () => {
    const acc = account();
    const payload = {
      platformLabel: "Yemek Sepeti",
      orderNumber: "A",
      items: [{ quantity: 1, name: "Lahmacun" }],
    };
    const first = enqueuePrintJob(acc, {
      source: "YEMEK_SEPETI",
      dedupeKey: "YEMEK_SEPETI:1",
      payload,
    });
    const second = enqueuePrintJob(acc, {
      source: "YEMEK_SEPETI",
      dedupeKey: "YEMEK_SEPETI:1",
      payload,
    });
    expect(second.id).toBe(first.id);
    expect(acc.jobs).toHaveLength(1);

    const reprint = enqueuePrintJob(acc, {
      source: "YEMEK_SEPETI",
      dedupeKey: "YEMEK_SEPETI:1",
      payload,
      force: true,
    });
    expect(reprint.id).not.toBe(first.id);
    expect(acc.jobs).toHaveLength(2);
  });

  it("records printed keys on ack", () => {
    const acc = account();
    const job = enqueuePrintJob(acc, {
      source: "TEST",
      dedupeKey: "TEST:1",
      payload: { platformLabel: "T", orderNumber: "1", items: [] },
      force: true,
    });
    ackPrintJob(acc, job.id, { status: "PRINTED" });
    expect(acc.printedKeys).toContain("TEST:1");
    expect(job.status).toBe("PRINTED");
  });
});
