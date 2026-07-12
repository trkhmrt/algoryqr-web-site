import axios, { AxiosError } from "axios";

import { PAYMENT_BASE_URL } from "@/lib/config";
import type { PaymentServiceCreateRequest } from "@/lib/package-payment";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

const PAYMENT_TIMEOUT_MS = 30_000;
const STATUS_TIMEOUT_MS = 15_000;

export type PaymentErrorBody = {
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string> | null;
};

type CreatePaymentResponse = {
  conversationId?: string;
};

type CreateThreeDsPaymentResponse = CreatePaymentResponse & {
  htmlContent?: string;
};

type PaymentStatusResponse = {
  status?: string;
};

function paymentUrl(path: string): string {
  return `${PAYMENT_BASE_URL}${path}`;
}

export function isPaymentUpstreamSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

export function paymentUpstreamErrorMessage(data: unknown, fallback = "Ödeme başlatılamadı"): string {
  if (typeof data !== "object" || data == null) return fallback;
  const body = data as PaymentErrorBody;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  return fallback;
}

export function isPaymentConnectionError(error: unknown): boolean {
  return error instanceof AxiosError && error.code === "ECONNREFUSED";
}

export function isPaymentTimeoutError(error: unknown): boolean {
  return error instanceof AxiosError && error.code === "ECONNABORTED";
}

export async function createPayment(body: PaymentServiceCreateRequest) {
  return axios.post<CreatePaymentResponse>(paymentUrl("/payments"), body, {
    headers: JSON_HEADERS,
    validateStatus: () => true,
    timeout: PAYMENT_TIMEOUT_MS,
  });
}

export async function createThreeDsPayment(body: PaymentServiceCreateRequest) {
  return axios.post<CreateThreeDsPaymentResponse>(paymentUrl("/payments/three-ds"), body, {
    headers: JSON_HEADERS,
    validateStatus: () => true,
    timeout: PAYMENT_TIMEOUT_MS,
  });
}

export async function completeThreeDsPayment(body: {
  conversationId: string;
  paymentId: string;
  conversationData?: string;
  locale: string;
}) {
  return axios.post(paymentUrl("/payments/three-ds/complete"), body, {
    headers: JSON_HEADERS,
    validateStatus: () => true,
    timeout: PAYMENT_TIMEOUT_MS,
  });
}

export async function getPaymentStatus(conversationId: string) {
  return axios.get<PaymentStatusResponse>(paymentUrl(`/payments/${encodeURIComponent(conversationId)}`), {
    headers: { Accept: "application/json" },
    validateStatus: () => true,
    timeout: STATUS_TIMEOUT_MS,
  });
}

export async function isPaymentPendingOnService(conversationId: string): Promise<boolean> {
  try {
    const upstream = await getPaymentStatus(conversationId);
    if (!isPaymentUpstreamSuccess(upstream.status)) return false;
    return upstream.data?.status === "PENDING";
  } catch {
    return false;
  }
}
