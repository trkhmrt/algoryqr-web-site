import type { PurchaseApiItem } from "@/lib/api";
import { isDateUsablePurchase } from "@/lib/product-access";

export const TRIAL_REMINDER_DAYS_THRESHOLD = 3;

const DISMISS_KEY_PREFIX = "algory-trial-reminder-dismissed";

export interface TrialReminderInfo {
  purchaseId: number;
  packageName: string;
  daysUntilExpiry: number;
  expiresAt?: string | null;
}

export function getTrialReminderInfo(
  activePurchase: PurchaseApiItem | null | undefined,
): TrialReminderInfo | null {
  if (!activePurchase) return null;
  if (activePurchase.purchaseType !== "TRIAL") return null;
  if (!isDateUsablePurchase(activePurchase)) return null;

  const days = activePurchase.daysUntilExpiry;
  if (typeof days !== "number" || !Number.isFinite(days)) return null;
  if (days < 0 || days > TRIAL_REMINDER_DAYS_THRESHOLD) return null;

  return {
    purchaseId: activePurchase.id,
    packageName: activePurchase.packageName ?? "Deneme paketi",
    daysUntilExpiry: days,
    expiresAt: activePurchase.expiresAt,
  };
}

export function getTrialReminderDismissKey(info: TrialReminderInfo): string {
  return `${DISMISS_KEY_PREFIX}-${info.purchaseId}-${info.daysUntilExpiry}`;
}

export function isTrialReminderDismissed(info: TrialReminderInfo): boolean {
  try {
    return sessionStorage.getItem(getTrialReminderDismissKey(info)) === "1";
  } catch {
    return false;
  }
}

export function dismissTrialReminder(info: TrialReminderInfo): void {
  try {
    sessionStorage.setItem(getTrialReminderDismissKey(info), "1");
  } catch {
    /* ignore */
  }
}
