import { api } from "@/lib/api/client";

export type SmartSummaryProductInput = Record<string, unknown>;

export type SmartSummaryRequestBody = {
  product: SmartSummaryProductInput;
  locale?: string;
  options?: {
    tone?: string;
    maxLength?: string;
  };
};

export type SmartSummaryResponse = {
  description: string;
  model?: string | null;
  promptVersion?: string | null;
};

export async function createSmartSummaryRequest(
  body: SmartSummaryRequestBody,
): Promise<SmartSummaryResponse> {
  const response = await api.post<SmartSummaryResponse>("/smart-summary", body, {
    timeout: 60_000,
  });
  return response.data;
}
