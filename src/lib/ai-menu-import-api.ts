import { api } from "@/lib/api/client";

export type AiMenuImportJobAccepted = {
  jobId: string;
  status: string;
};

export type AiMenuImportJob = {
  jobId: string;
  menuId: number;
  status: string;
  imageUrls?: string[];
  errorMessage?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type AiMenuImportDraft = {
  id: string;
  jobId: string;
  menuId: number;
  sourceProductId: string;
  productData?: Record<string, unknown> | null;
  confidence?: number | null;
  approvalStatus: string;
  publishedProductId?: number | null;
  rejectReason?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AiMenuImportDraftPage = {
  content: AiMenuImportDraft[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
};

export type AiMenuImportDraftUpdate = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  subCategoryId?: number;
  imageUrl?: string;
  available?: boolean;
};

export async function createAiMenuImportJob(menuId: number, imageUrls: string[]) {
  const { data } = await api.post<AiMenuImportJobAccepted>(`/menus/${menuId}/ai-import/jobs`, {
    imageUrls,
  });
  return data;
}

export async function getAiMenuImportJob(menuId: number, jobId: string) {
  const { data } = await api.get<AiMenuImportJob>(`/menus/${menuId}/ai-import/jobs/${jobId}`);
  return data;
}

export async function listAiMenuImportDrafts(
  menuId: number,
  options?: { status?: string; jobId?: string; page?: number; size?: number },
) {
  const { data } = await api.get<AiMenuImportDraftPage>(`/menus/${menuId}/ai-import/drafts`, {
    params: {
      status: options?.status ?? "WAITING_APPROVAL",
      jobId: options?.jobId,
      page: options?.page ?? 0,
      size: options?.size ?? 50,
    },
  });
  return data;
}

export async function updateAiMenuImportDraft(
  menuId: number,
  draftId: string,
  payload: AiMenuImportDraftUpdate,
) {
  const { data } = await api.patch<AiMenuImportDraft>(
    `/menus/${menuId}/ai-import/drafts/${draftId}`,
    payload,
  );
  return data;
}

export async function approveAiMenuImportDraft(menuId: number, draftId: string) {
  const { data } = await api.post<AiMenuImportDraft>(
    `/menus/${menuId}/ai-import/drafts/${draftId}/approve`,
  );
  return data;
}

export async function bulkApproveAiMenuImportDrafts(menuId: number, draftIds: string[]) {
  const { data } = await api.post<AiMenuImportDraft[]>(
    `/menus/${menuId}/ai-import/drafts/bulk-approve`,
    { draftIds },
  );
  return data;
}

export async function rejectAiMenuImportDraft(
  menuId: number,
  draftId: string,
  reason?: string,
) {
  await api.post(`/menus/${menuId}/ai-import/drafts/${draftId}/reject`, {
    reason: reason ?? "",
  });
}

export function draftField(draft: AiMenuImportDraft, key: string): string {
  const value = draft.productData?.[key];
  if (value == null) return "";
  return String(value);
}

export function draftPrice(draft: AiMenuImportDraft): string {
  const value = draft.productData?.price;
  if (value == null) return "";
  return String(value);
}

export function isAiImportJobPending(status: string): boolean {
  return (
    status === "QUEUED" ||
    status === "EXTRACTING" ||
    status === "BATCH_SUBMITTED" ||
    status === "BATCH_IN_PROGRESS"
  );
}
