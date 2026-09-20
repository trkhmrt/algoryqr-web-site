import type { PrintSource, ReceiptPayload } from "@/lib/receipt-ticket";
import {
  type PrintJob,
  type PrinterAccount,
  newPrinterJobId,
} from "@/lib/server/printer-store";

export function enqueuePrintJob(
  account: PrinterAccount,
  input: {
    source: PrintSource;
    dedupeKey: string;
    payload: ReceiptPayload;
    copies?: number;
    force?: boolean;
  },
): PrintJob {
  const copies = Math.min(5, Math.max(1, input.copies ?? account.settings.copies ?? 1));
  if (!input.force) {
    const existingPending = account.jobs.find(
      (job) => job.dedupeKey === input.dedupeKey && job.status === "PENDING",
    );
    if (existingPending) return existingPending;
    if (account.printedKeys.includes(input.dedupeKey)) {
      const printed = account.jobs.find((job) => job.dedupeKey === input.dedupeKey);
      if (printed) return printed;
    }
  }

  const job: PrintJob = {
    id: newPrinterJobId(),
    userId: account.userId,
    source: input.source,
    dedupeKey: input.dedupeKey,
    status: "PENDING",
    payload: input.payload,
    copies,
    createdAt: new Date().toISOString(),
  };
  account.jobs.unshift(job);
  account.jobs = account.jobs.slice(0, 400);
  return job;
}

export function ackPrintJob(
  account: PrinterAccount,
  jobId: string,
  result: { status: "PRINTED" | "FAILED"; error?: string },
): PrintJob | null {
  const job = account.jobs.find((entry) => entry.id === jobId);
  if (!job) return null;
  job.status = result.status;
  job.error = result.error;
  if (result.status === "PRINTED") {
    job.printedAt = new Date().toISOString();
    if (!account.printedKeys.includes(job.dedupeKey)) {
      account.printedKeys.push(job.dedupeKey);
      account.printedKeys = account.printedKeys.slice(-2000);
    }
  }
  return job;
}

export function pendingJobs(account: PrinterAccount): PrintJob[] {
  return account.jobs.filter((job) => job.status === "PENDING");
}
