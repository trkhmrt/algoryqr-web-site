import { describe, expect, it } from "vitest";

import type { PurchaseApiItem } from "./api";
import {
  getTrialReminderInfo,
  shouldAutoOpenTrialReminder,
} from "./trial-reminder";

function trialPurchase(daysUntilExpiry: number): PurchaseApiItem {
  return {
    id: 1,
    packageId: 2,
    packageCode: "ULTIMATE_TRIAL_PACKAGE",
    packageName: "Ultimate Deneme",
    purchaseType: "TRIAL",
    status: "ACTIVE",
    usable: true,
    expired: false,
    daysUntilExpiry,
    expiresAt: new Date(Date.now() + daysUntilExpiry * 86_400_000).toISOString(),
  };
}

describe("trial-reminder", () => {
  it("shows badge for any remaining trial day", () => {
    expect(getTrialReminderInfo(trialPurchase(15))?.daysUntilExpiry).toBe(15);
    expect(getTrialReminderInfo(trialPurchase(1))?.daysUntilExpiry).toBe(1);
  });

  it("hides badge when trial already expired", () => {
    expect(getTrialReminderInfo(trialPurchase(-1))).toBeNull();
  });

  it("auto-opens only in the last three days", () => {
    const info = getTrialReminderInfo(trialPurchase(15));
    expect(info).not.toBeNull();
    expect(shouldAutoOpenTrialReminder(info!)).toBe(false);
    expect(shouldAutoOpenTrialReminder(getTrialReminderInfo(trialPurchase(3))!)).toBe(true);
  });
});
