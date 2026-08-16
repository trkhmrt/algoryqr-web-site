"use client";

import { useMemo } from "react";

import { useSubscription } from "@/hooks/use-subscription";
import { getTrialReminderInfo, type TrialReminderInfo } from "@/lib/trial-reminder";

export function useTrialReminder(): {
  info: TrialReminderInfo | null;
  isLoading: boolean;
} {
  const subscription = useSubscription();
  const info = useMemo(
    () => getTrialReminderInfo(subscription.data?.activePurchase),
    [subscription.data?.activePurchase],
  );

  return {
    info,
    isLoading: subscription.isLoading,
  };
}
