import { api } from "@/lib/api/client";

export type AiMenuImportJobAccepted = {
  jobId: string;
  status: string;
};

export type AiMenuImportJob = {
  jobId: string;
  menuId: number;
  userId?: number;
  status: string;
  imageUrls?: string[];
  publishedCount?: number;
  productCount?: number;
  errorMessage?: string | null;
  createdAt?: string;
  completedAt?: string | null;
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

export function isAiImportJobPending(status: string): boolean {
  return (
    status === "queued" ||
    status === "processing" ||
    status === "waiting_batch" ||
    status === "publishing"
  );
}

export function isAiImportJobCompleted(status: string): boolean {
  return status === "completed";
}
