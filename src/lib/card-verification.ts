"use client";

import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export const CARD_VERIFICATION_POLL_INTERVAL_MS = 2_000;
export const CARD_VERIFICATION_POLL_TIMEOUT_MS = 90_000;

export type CardVerificationStatusValue = "INITIATED" | "SUCCESS" | "REFUNDED" | "FAILURE" | string;

export interface CardVerificationInitResponse {
  conversationId: string;
  token?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
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
