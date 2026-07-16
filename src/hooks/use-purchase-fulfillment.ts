"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getPurchaseInstallments,
  getPurchaseSummary,
  PURCHASE_POLL_INTERVAL_MS,
  PURCHASE_POLL_TIMEOUT_MS,
} from "@/lib/purchase-fulfillment";

export function usePurchaseFulfillment(purchaseId: number | null, startedAt: number | null) {
  const [timedOutPurchaseId, setTimedOutPurchaseId] = useState<number | null>(null);

  useEffect(() => {
    if (purchaseId == null || startedAt == null) return;
    const remaining = Math.max(0, PURCHASE_POLL_TIMEOUT_MS - (Date.now() - startedAt));
    const timeout = window.setTimeout(() => setTimedOutPurchaseId(purchaseId), remaining);
    return () => window.clearTimeout(timeout);
  }, [purchaseId, startedAt]);

  const summary = useQuery({
    queryKey: ["purchase", purchaseId, "summary"],
    queryFn: () => getPurchaseSummary(purchaseId as number),
    enabled: purchaseId != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const timedOut = startedAt != null && Date.now() - startedAt >= PURCHASE_POLL_TIMEOUT_MS;
      return status === "PENDING" && !timedOut ? PURCHASE_POLL_INTERVAL_MS : false;
    },
    retry: 1,
  });

  const installments = useQuery({
    queryKey: ["purchase", purchaseId, "installments"],
    queryFn: () => getPurchaseInstallments(purchaseId as number),
    enabled: purchaseId != null && summary.data?.status === "ACTIVE",
    retry: false,
  });

  const timedOut = summary.data?.status === "PENDING" && timedOutPurchaseId === purchaseId;

  return { summary, installments, timedOut };
}
