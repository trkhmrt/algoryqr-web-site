"use client";

import type {
  InstallmentOptionApiItem,
  InstallmentScheduleApiItem,
  PlanPackageApiItem,
  PurchaseSummaryApiItem,
} from "@/lib/api";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export const PURCHASE_ID_STORAGE_KEY = "algory_pending_purchase_id";
export const PURCHASE_POLL_INTERVAL_MS = 2_000;
export const PURCHASE_POLL_TIMEOUT_MS = 120_000;

export type PaymentMode = "DIRECT" | "THREE_DS";

export interface PurchaseInitiateResponse {
  purchaseId: number;
  status: string;
  conversationId?: string;
  paymentHtml?: string;
  htmlContent?: string;
}

export function getPaymentModes(pkg: PlanPackageApiItem): PaymentMode[] {
  const modes = pkg.allowedPaymentModes?.filter(
    (mode): mode is PaymentMode => mode === "DIRECT" || mode === "THREE_DS",
  );
  return modes?.length ? modes : ["THREE_DS"];
}

export function getInstallmentOptions(pkg: PlanPackageApiItem): InstallmentOptionApiItem[] {
  if (pkg.installmentOptions?.length) {
    return pkg.installmentOptions.filter((option) => option.installmentCount > 0);
  }
  if (pkg.allowedInstallments?.length) {
    return pkg.allowedInstallments
      .filter((count) => Number.isInteger(count) && count > 0)
      .map((installmentCount) => ({ installmentCount }));
  }
  return [{ installmentCount: 1, monthlyAmount: pkg.price, totalAmount: pkg.price }];
}

export function storePendingPurchaseId(purchaseId: number) {
  sessionStorage.setItem(PURCHASE_ID_STORAGE_KEY, String(purchaseId));
}

export function readPendingPurchaseId(): number | null {
  const value = sessionStorage.getItem(PURCHASE_ID_STORAGE_KEY);
  if (!value) return null;
  const purchaseId = Number(value);
  return Number.isSafeInteger(purchaseId) && purchaseId > 0 ? purchaseId : null;
}

export function clearPendingPurchaseId() {
  sessionStorage.removeItem(PURCHASE_ID_STORAGE_KEY);
}

export async function getPurchaseSummary(purchaseId: number): Promise<PurchaseSummaryApiItem> {
  const response = await getSiteSameOriginAxios().get<PurchaseSummaryApiItem>(
    `/purchases/${purchaseId}/summary`,
  );
  return response.data;
}

export async function getPurchaseInstallments(
  purchaseId: number,
): Promise<InstallmentScheduleApiItem[]> {
  try {
    const response = await getSiteSameOriginAxios().get<InstallmentScheduleApiItem[]>(
      `/purchases/${purchaseId}/installments`,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
