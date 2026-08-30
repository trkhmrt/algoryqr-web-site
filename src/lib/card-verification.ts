"use client";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { resolveSafeReturnUrl } from "@/lib/trial-flow";

export const CARD_VERIFICATION_POLL_INTERVAL_MS = 2_000;
export const CARD_VERIFICATION_POLL_TIMEOUT_MS = 90_000;
export const CARD_VERIFICATION_RETURN_KEY = "algory_card_verification_return";

export type CardVerificationStatusValue = "INITIATED" | "SUCCESS" | "REFUNDED" | "FAILURE" | string;

export interface CardVerificationInitResponse {
  conversationId: string;
  actionUrl: string;
  fields: Record<string, string>;
}

export interface CardVerificationStatusResponse {
  conversationId: string;
  status: CardVerificationStatusValue;
}

export function isCardVerificationComplete(status: CardVerificationStatusValue | undefined): boolean {
  return status === "SUCCESS" || status === "REFUNDED";
}

export function isCardVerificationFailed(status: CardVerificationStatusValue | undefined): boolean {
  return status === "FAILURE";
}

export function isCardVerificationConversation(conversationId: string | null | undefined): boolean {
  if (conversationId == null || conversationId === "") {
    return false;
  }
  if (conversationId.startsWith("qr-card-verification-")) {
    return true;
  }
  return conversationId.replace(/[^A-Za-z0-9]/g, "").toLowerCase().startsWith("qrcardv");
}

export function persistCardVerificationReturn(returnPath: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const safe = resolveSafeReturnUrl(returnPath);
  if (!safe) {
    return;
  }
  sessionStorage.setItem(CARD_VERIFICATION_RETURN_KEY, safe);
}

export function readCardVerificationReturn(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return resolveSafeReturnUrl(sessionStorage.getItem(CARD_VERIFICATION_RETURN_KEY));
}

export function clearCardVerificationReturn(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(CARD_VERIFICATION_RETURN_KEY);
}

export function resolveCardVerificationReturnPath(fallback = DASHBOARD_ROUTES.accountPaymentMethods): string {
  return readCardVerificationReturn() ?? fallback;
}

export async function initiateCardVerification(): Promise<CardVerificationInitResponse> {
  const response = await getSiteSameOriginAxios().post<CardVerificationInitResponse>(
    "/account/payment-methods/verification",
  );
  return response.data;
}

export async function getCardVerificationStatus(conversationId: string): Promise<CardVerificationStatusResponse> {
  const response = await getSiteSameOriginAxios().get<CardVerificationStatusResponse>(
    `/account/payment-methods/verification/${encodeURIComponent(conversationId)}`,
  );
  return response.data;
}
