"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CARD_VERIFICATION_POLL_INTERVAL_MS,
  CARD_VERIFICATION_POLL_TIMEOUT_MS,
  getCardVerificationStatus,
} from "@/lib/card-verification";

export function useCardVerificationStatus(conversationId: string | null, startedAt: number | null) {
  const [timedOutConversationId, setTimedOutConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId == null || startedAt == null) return;
    const remaining = Math.max(0, CARD_VERIFICATION_POLL_TIMEOUT_MS - (Date.now() - startedAt));
    const timeout = window.setTimeout(() => setTimedOutConversationId(conversationId), remaining);
    return () => window.clearTimeout(timeout);
  }, [conversationId, startedAt]);

  const status = useQuery({
    queryKey: ["cardVerification", conversationId, "status"],
    queryFn: () => getCardVerificationStatus(conversationId as string),
    enabled: conversationId != null,
    refetchInterval: (query) => {
      const value = query.state.data?.status;
      const timedOut = startedAt != null && Date.now() - startedAt >= CARD_VERIFICATION_POLL_TIMEOUT_MS;
      return value === "INITIATED" && !timedOut ? CARD_VERIFICATION_POLL_INTERVAL_MS : false;
    },
    retry: 1,
  });

  const timedOut = conversationId != null && timedOutConversationId === conversationId;

  return { status, timedOut };
}
