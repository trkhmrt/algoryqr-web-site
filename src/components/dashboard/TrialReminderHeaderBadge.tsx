"use client";

import TrialReminderBadge from "@/components/dashboard/TrialReminderBadge";
import { useTrialReminder } from "@/hooks/use-trial-reminder";

interface TrialReminderHeaderBadgeProps {
  compact?: boolean;
}

export default function TrialReminderHeaderBadge({ compact = false }: TrialReminderHeaderBadgeProps) {
  const { info } = useTrialReminder();
  if (!info) return null;
  return <TrialReminderBadge info={info} compact={compact} />;
}
