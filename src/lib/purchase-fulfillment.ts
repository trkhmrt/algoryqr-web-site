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

export type PaymentMode = "DIRECT" | "THREE_DS" | "CHECKOUT_FORM";

export interface PurchaseInitiateResponse {
  purchaseId: number;
  status: string;
  conversationId?: string;
  paymentHtml?: string;
  htmlContent?: string;
  token?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
}

export function getPaymentModes(pkg: PlanPackageApiItem): PaymentMode[] {
  const modes = pkg.allowedPaymentModes?.filter(
    (mode): mode is PaymentMode =>
      mode === "CHECKOUT_FORM" || mode === "DIRECT" || mode === "THREE_DS",
  );
  return modes?.length ? modes : ["CHECKOUT_FORM"];
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

export function canCancelPurchase(purchase: {
  status?: string | null;
  purchaseType?: string | null;
  packageCode?: string | null;
  paymentStyle?: string | null;
}): boolean {
  const status = purchase.status ?? "";
  if (status !== "ACTIVE" && status !== "PENDING") {
    return false;
  }
  if (purchase.purchaseType === "FREE" || purchase.purchaseType === "SYSTEM_GRANT") {
    return false;
  }
  if (purchase.packageCode === "FREE_PACKAGE") {
    return false;
  }
  if (status === "ACTIVE" && purchase.paymentStyle === "SUBSCRIPTION" && purchase.purchaseType === "PAID") {
    return false;
  }
  return true;
}

export function canCancelAtPeriodEnd(purchase: {
  status?: string | null;
  purchaseType?: string | null;
  paymentStyle?: string | null;
  cancelAtPeriodEnd?: boolean | null;
}): boolean {
  return (
    purchase.status === "ACTIVE" &&
    purchase.paymentStyle === "SUBSCRIPTION" &&
    purchase.purchaseType === "PAID" &&
    !purchase.cancelAtPeriodEnd
  );
}

export function canCancelWithRefund(purchase: {
  status?: string | null;
  purchaseType?: string | null;
  paymentStyle?: string | null;
  refundEligible?: boolean | null;
}): boolean {
  return (
    purchase.status === "ACTIVE" &&
    purchase.paymentStyle === "SUBSCRIPTION" &&
    purchase.purchaseType === "PAID" &&
    !!purchase.refundEligible
  );
}

export function canResumeRenewal(purchase: {
  status?: string | null;
  purchaseType?: string | null;
  paymentStyle?: string | null;
  cancelAtPeriodEnd?: boolean | null;
}): boolean {
  return (
    purchase.status === "ACTIVE" &&
    purchase.paymentStyle === "SUBSCRIPTION" &&
    purchase.purchaseType === "PAID" &&
    !!purchase.cancelAtPeriodEnd
  );
}

export function canPaySubscriptionDebt(purchase: {
  status?: string | null;
  paymentStyle?: string | null;
  subscriptionStatus?: string | null;
  manualPaymentRequired?: boolean | null;
  subscriptionGraceEndsAt?: string | null;
  nextPaymentDueAt?: string | null;
  paymentApproaching?: boolean | null;
}): boolean {
  if (purchase.paymentStyle !== "SUBSCRIPTION") {
    return false;
  }
  if (purchase.status !== "ACTIVE" && purchase.status !== "EXPIRED") {
    return false;
  }
  if (purchase.subscriptionStatus === "PAST_DUE") {
    if (!purchase.subscriptionGraceEndsAt) {
      return true;
    }
    const graceEndsAt = Date.parse(purchase.subscriptionGraceEndsAt);
    return Number.isFinite(graceEndsAt) && graceEndsAt >= Date.now();
  }
  if (purchase.manualPaymentRequired !== true) {
    return false;
  }
  if (purchase.paymentApproaching) {
    return true;
  }
  if (!purchase.nextPaymentDueAt) {
    return false;
  }
  const dueAt = Date.parse(purchase.nextPaymentDueAt);
  return Number.isFinite(dueAt) && dueAt <= Date.now();
}

export function isSubscriptionPastDue(purchase: {
  subscriptionStatus?: string | null;
}): boolean {
  return purchase.subscriptionStatus === "PAST_DUE";
}

export async function cancelPurchase(purchaseId: number): Promise<PurchaseSummaryApiItem> {
  const response = await getSiteSameOriginAxios().post<PurchaseSummaryApiItem>(
    `/purchases/${purchaseId}/cancel`,
  );
  return response.data;
}

export async function cancelPurchaseAtPeriodEnd(purchaseId: number): Promise<PurchaseSummaryApiItem> {
  const response = await getSiteSameOriginAxios().post<PurchaseSummaryApiItem>(
    `/purchases/${purchaseId}/cancel-at-period-end`,
  );
  return response.data;
}

export async function cancelPurchaseWithRefund(purchaseId: number): Promise<PurchaseSummaryApiItem> {
  const response = await getSiteSameOriginAxios().post<PurchaseSummaryApiItem>(
    `/purchases/${purchaseId}/cancel-with-refund`,
  );
  return response.data;
}

export async function resumePurchaseRenewal(purchaseId: number): Promise<PurchaseSummaryApiItem> {
  const response = await getSiteSameOriginAxios().post<PurchaseSummaryApiItem>(
    `/purchases/${purchaseId}/resume-renewal`,
  );
  return response.data;
}

export async function paySubscriptionDebt(purchaseId: number): Promise<PurchaseInitiateResponse> {
  const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>(
    `/purchases/${purchaseId}/pay-debt`,
  );
  return response.data;
}

export async function abandonPendingPaymentAttempt(options?: { cancelIfPending?: boolean }) {
  const purchaseId = readPendingPurchaseId();
  clearPendingPurchaseId();
  if (!options?.cancelIfPending || purchaseId == null) {
    return purchaseId;
  }
  try {
    const summary = await getPurchaseSummary(purchaseId);
    if (summary.status === "PENDING") {
      await cancelPurchase(purchaseId);
    }
  } catch {
    /* already failed/cancelled */
  }
  return purchaseId;
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
