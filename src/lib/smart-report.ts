import { api } from "@/lib/api/client";

export type SmartReportJobStatus =
  | "queued"
  | "processing"
  | "running"
  | "completed"
  | "failed";

export type SmartReportUiStatus = "idle" | "pending" | "ready" | "failed";

export type SmartReportResult = {
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
  rawMarkdown: string;
  model?: string | null;
  promptVersion?: string | null;
  usage?: {
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
  } | null;
};

export type SmartReportAccepted = {
  jobId: string;
  processId?: string;
  status: SmartReportJobStatus;
};

export type SmartReportJobResponse = {
  jobId: string;
  processId?: string;
  status: SmartReportJobStatus;
  result?: SmartReportResult | null;
  resultText?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
};

export type SmartReportDetailResponse = SmartReportJobResponse & {
  menuId: number;
  menuName: string;
  from: string;
  to: string;
  locale?: string | null;
  requestedAt?: string | null;
};

export type SmartReportListItem = {
  jobId: string;
  processId?: string;
  menuId: number;
  menuName: string;
  from: string;
  to: string;
  locale?: string | null;
  status?: SmartReportJobStatus;
  createdAt: string;
  completedAt?: string | null;
};

export type SmartReportListPage = {
  content: SmartReportListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type SmartReportQuota = {
  period: "DAY" | "WEEK" | string;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  lastUsage?: string | null;
};

export type StoredSmartReportJob = {
  jobId: string;
  status: SmartReportJobStatus;
  savedAt: number;
};

export const SMART_REPORT_POLL_INTERVAL_MS = 5 * 60_000;
export const SMART_REPORT_QUOTA_ZONE = "Europe/Istanbul";

export function smartReportStorageKey(menuId: number, from: string, to: string): string {
  return `smart-report:${menuId}:${from}:${to}`;
}

export function resolveSmartReportProcessId(
  value: { jobId?: string | null; processId?: string | null } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value.processId === "string" && value.processId.length > 0) {
    return value.processId;
  }
  if (typeof value.jobId === "string" && value.jobId.length > 0) {
    return value.jobId;
  }
  return null;
}

export function isSmartReportPending(
  status: SmartReportJobStatus | null | undefined,
): boolean {
  return status === "queued" || status === "processing" || status === "running";
}

export function isSmartReportCompleted(
  status: SmartReportJobStatus | null | undefined,
): boolean {
  return status === "completed";
}

export function toSmartReportUiStatus(
  status: SmartReportJobStatus | null | undefined,
): SmartReportUiStatus {
  if (status == null) return "idle";
  if (isSmartReportPending(status)) return "pending";
  if (status === "completed") return "ready";
  return "failed";
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
  };
}

function startOfZonedDayMs(date: Date, timeZone: string): number {
  const { year, month, day } = zonedParts(date, timeZone);
  return Date.parse(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+03:00`);
}

function startOfZonedWeekMs(date: Date, timeZone: string): number {
  const weekday = zonedParts(date, timeZone).weekday;
  const dayIndex =
    weekday === "Mon"
      ? 0
      : weekday === "Tue"
        ? 1
        : weekday === "Wed"
          ? 2
          : weekday === "Thu"
            ? 3
            : weekday === "Fri"
              ? 4
              : weekday === "Sat"
                ? 5
                : 6;
  const dayStart = startOfZonedDayMs(date, timeZone);
  return dayStart - dayIndex * 86_400_000;
}

export function isLastUsageWithinQuotaPeriod(
  lastUsage: string | null | undefined,
  period: SmartReportQuota["period"],
  now: Date = new Date(),
  timeZone: string = SMART_REPORT_QUOTA_ZONE,
): boolean {
  if (!lastUsage) return false;
  const usageMs = new Date(lastUsage).getTime();
  if (!Number.isFinite(usageMs)) return false;
  if (period === "WEEK") {
    return usageMs >= startOfZonedWeekMs(now, timeZone);
  }
  return usageMs >= startOfZonedDayMs(now, timeZone);
}

export function isSmartReportQuotaExhausted(quota: SmartReportQuota | null | undefined): boolean {
  if (!quota) return false;
  if (quota.remaining <= 0) return true;
  if (quota.limit <= 0) return true;
  if (
    quota.limit === 1 &&
    isLastUsageWithinQuotaPeriod(quota.lastUsage, quota.period)
  ) {
    return true;
  }
  return false;
}

export function normalizeSmartReportResult(
  detail: Pick<SmartReportJobResponse, "result" | "resultText"> | null | undefined,
): SmartReportResult | null {
  if (!detail) return null;
  if (detail.result) {
    const rawMarkdown =
      detail.result.rawMarkdown?.trim() ||
      detail.resultText?.trim() ||
      "";
    return {
      ...detail.result,
      rawMarkdown:
        rawMarkdown ||
        [detail.result.summary, ...(detail.result.sections ?? []).map((s) => s.body)]
          .filter(Boolean)
          .join("\n\n"),
    };
  }
  const text = detail.resultText?.trim();
  if (!text) return null;
  return {
    title: "Akilli Rapor",
    summary: text.slice(0, 280),
    sections: [],
    rawMarkdown: text,
  };
}

function getLocalStorage(): Storage | null {
  try {
    const root = globalThis as typeof globalThis & {
      window?: { localStorage?: Storage };
      localStorage?: Storage;
    };
    return root.window?.localStorage ?? root.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readStoredSmartReportJob(
  menuId: number,
  from: string,
  to: string,
): StoredSmartReportJob | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(smartReportStorageKey(menuId, from, to));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSmartReportJob;
    if (!parsed?.jobId || typeof parsed.jobId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSmartReportJob(
  menuId: number,
  from: string,
  to: string,
  value: StoredSmartReportJob,
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(
      smartReportStorageKey(menuId, from, to),
      JSON.stringify(value),
    );
  } catch {
  }
}

export function clearStoredSmartReportJob(
  menuId: number,
  from: string,
  to: string,
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(smartReportStorageKey(menuId, from, to));
  } catch {
  }
}

export async function createSmartReportRequest(body: {
  menuId: number;
  from: string;
  to: string;
  locale?: string;
}): Promise<SmartReportAccepted> {
  const response = await api.post<SmartReportAccepted>("/smart-reports", body);
  return response.data;
}

export async function getSmartReportJobRequest(
  jobId: string,
): Promise<SmartReportDetailResponse | SmartReportJobResponse> {
  const response = await api.get<SmartReportDetailResponse>(`/smart-reports/${jobId}`);
  return response.data;
}

export async function listSmartReportsRequest(params?: {
  page?: number;
  size?: number;
  status?: SmartReportJobStatus;
}): Promise<SmartReportListPage> {
  const response = await api.get<SmartReportListPage>("/smart-reports", {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: "createdAt,desc",
      status: params?.status ?? "completed",
    },
  });
  return response.data;
}

export async function getSmartReportQuotaRequest(): Promise<SmartReportQuota> {
  const response = await api.get<SmartReportQuota>("/smart-reports/quota");
  return response.data;
}

export function smartReportQuotaLabel(quota: SmartReportQuota): string {
  if (quota.period === "WEEK") {
    return `Bu hafta ${quota.used}/${quota.limit} hak kullanildi`;
  }
  return `Bugun ${quota.used}/${quota.limit} hak kullanildi`;
}

export function buildSmartReportMarkdown(
  result: Pick<SmartReportResult, "summary" | "sections" | "rawMarkdown">,
): string {
  const fromSections =
    result.sections?.length > 0
      ? result.sections
          .map((section) => `## ${section.heading}\n\n${section.body}`)
          .join("\n\n")
      : "";
  return (
    result.rawMarkdown?.trim() ||
    [result.summary?.trim(), fromSections].filter(Boolean).join("\n\n")
  );
}
