"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import type {
  BillingAddress,
  BinInstallmentOption,
  DigitalMenuTrialStatus,
  PaymentMethod,
} from "@/lib/commerce";
import { mapTrialStatus } from "@/lib/commerce";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export const BILLING_ADDRESSES_QUERY_KEY = ["billingAddresses"] as const;
export const PAYMENT_METHODS_QUERY_KEY = ["paymentMethods"] as const;
export const DIGITAL_MENU_TRIAL_QUERY_KEY = ["digitalMenuTrial"] as const;
export const TRIAL_STATUS_QUERY_KEY = ["trialStatus"] as const;
export const ELIGIBLE_TRIAL_PACKAGES_QUERY_KEY = ["eligibleTrialPackages"] as const;

function listFromPayload<TEntity>(payload: unknown, keys: string[]): TEntity[] {
  if (Array.isArray(payload)) return payload as TEntity[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as TEntity[];
  }
  return [];
}

export function useBillingAddresses() {
  return useQuery({
    queryKey: BILLING_ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get("/account/billing-addresses");
      return listFromPayload<BillingAddress>(response.data, ["items", "addresses", "content"]);
    },
    staleTime: 30_000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_METHODS_QUERY_KEY,
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get("/account/payment-methods");
      const raw = listFromPayload<Record<string, unknown>>(response.data, ["items", "paymentMethods", "cards", "content"]);
      return raw.map((item) => ({
        id: String(item.id),
        cardAlias: (item.cardAlias as string | null | undefined) ?? (item.alias as string | null | undefined) ?? null,
        brand: (item.brand as string | null | undefined) ?? null,
        lastFour: String(item.lastFour ?? item.last4 ?? item.lastFourDigits ?? ""),
        expiryMonth: (item.expiryMonth as number | null | undefined) ?? null,
        expiryYear: (item.expiryYear as number | null | undefined) ?? null,
      })) satisfies PaymentMethod[];
    },
    staleTime: 30_000,
  });
}

export function useDigitalMenuTrialStatus() {
  return useTrialStatus();
}

export function useTrialStatus(enabled = true) {
  return useQuery({
    queryKey: TRIAL_STATUS_QUERY_KEY,
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get("/trials/status");
      return mapTrialStatus(response.data) satisfies DigitalMenuTrialStatus;
    },
    enabled,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useEligibleTrialPackages(enabled = true) {
  return useQuery({
    queryKey: ELIGIBLE_TRIAL_PACKAGES_QUERY_KEY,
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get("/trials/eligible-packages");
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export async function startTrialRequest(packageId: number) {
  const response = await getSiteSameOriginAxios().post("/trials", { packageId });
  return mapTrialStatus(response.data);
}

export function useInstallmentOptions(bin: string, amount: number | string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["installmentOptions", bin, amount],
    queryFn: async () => {
      const response = await getSiteSameOriginAxios().get("/payments/installment-options", {
        params: {
          binNumber: bin,
          amount,
          currency: "TRY",
        },
      });
      const options = listFromPayload<Record<string, unknown>>(response.data, ["options", "items", "installmentOptions"]);
      return options.map((option) => ({
        installmentCount: Number(option.count ?? option.installmentCount ?? 1),
        monthlyAmount: (option.installmentAmount as number | string | null | undefined)
          ?? (option.monthlyAmount as number | string | null | undefined)
          ?? null,
        totalAmount: (option.totalAmount as number | string | null | undefined) ?? null,
      })) satisfies BinInstallmentOption[];
    },
    enabled: enabled && bin.length >= 6 && amount != null,
    staleTime: 300_000,
    retry: 1,
  });
}

export function invalidateBillingAddresses(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: BILLING_ADDRESSES_QUERY_KEY });
}

export function invalidatePaymentMethods(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_QUERY_KEY });
}

export function invalidateDigitalMenuTrial(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: DIGITAL_MENU_TRIAL_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: TRIAL_STATUS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ELIGIBLE_TRIAL_PACKAGES_QUERY_KEY }),
  ]);
}
