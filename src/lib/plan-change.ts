import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { ApiError } from "@/lib/api/errors";

export type PlanChangeTiming = "IMMEDIATE" | "NEXT_PERIOD";
export type PlanChangeDirection = "UPGRADE" | "DOWNGRADE" | "LATERAL";
export type PlanChangeStatus =
  | "PENDING_PAYMENT"
  | "SCHEDULED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface PlanChangePackageSummary {
  id: number;
  code: string;
  name: string;
  price: number | string;
  currency: string;
  validityDays: number;
  features?: string[];
}

export interface PlanChangeOption {
  timing: PlanChangeTiming;
  chargeNow: number | string;
  refundNow: number | string;
  chargeAtEffective: number | string;
  effectiveAt: string;
  entitlementsPolicy: string;
}

export interface PlanChangePreview {
  fromPurchaseId: number;
  fromPackage: PlanChangePackageSummary;
  toPackage: PlanChangePackageSummary;
  direction: PlanChangeDirection;
  currentExpiresAt: string;
  options: PlanChangeOption[];
  warnings: string[];
  hasScheduledChange: boolean;
}

export interface PlanChangeItem {
  id: number;
  userId: number;
  fromPurchaseId: number;
  fromPackageId: number;
  toPackageId: number;
  fromPackageCode?: string;
  toPackageCode?: string;
  fromPackageName?: string;
  toPackageName?: string;
  direction: PlanChangeDirection;
  timing: PlanChangeTiming;
  status: PlanChangeStatus;
  chargeAmount: number | string;
  refundAmount?: number | string;
  currency: string;
  paymentMethodId?: number | null;
  effectiveAt: string;
  resultingPurchaseId?: number | null;
  warningAck: boolean;
  createdAt?: string;
  completedAt?: string | null;
  conversationId?: string;
  token?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
}

export async function previewPlanChange(toPackageId: number): Promise<PlanChangePreview> {
  try {
    const response = await getSiteSameOriginAxios().get<PlanChangePreview>("/plan-changes/preview", {
      params: { toPackageId },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error, "Paket gecisi onizlemesi alinamadi");
  }
}

export async function requestPlanChange(body: {
  toPackageId: number;
  timing: PlanChangeTiming;
  paymentMethodId?: number;
  warningAck: boolean;
}): Promise<PlanChangeItem> {
  try {
    const response = await getSiteSameOriginAxios().post<PlanChangeItem>("/plan-changes", body);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Paket gecisi baslatilamadi");
  }
}

export async function listMyPlanChanges(): Promise<PlanChangeItem[]> {
  try {
    const response = await getSiteSameOriginAxios().get<PlanChangeItem[]>("/plan-changes/my");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw toApiError(error, "Paket gecisleri alinamadi");
  }
}

export async function cancelPlanChange(id: number): Promise<PlanChangeItem> {
  try {
    const response = await getSiteSameOriginAxios().post<PlanChangeItem>(`/plan-changes/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "Planlanan gecis iptal edilemedi");
  }
}

export function directionLabel(direction: PlanChangeDirection): string {
  switch (direction) {
    case "UPGRADE":
      return "Yükseltme";
    case "DOWNGRADE":
      return "Düşürme";
    default:
      return "Paket değişikliği";
  }
}

export function toAmountNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof ApiError) return error;
  const axiosError = error as {
    response?: { data?: { message?: string }; status?: number };
    message?: string;
  };
  const message = axiosError.response?.data?.message || axiosError.message || fallback;
  return new ApiError(axiosError.response?.status ?? 500, message);
}
