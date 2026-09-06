import { describe, expect, it } from "vitest";

import {
  branchAllowsFirstMenu,
  canCreateMenuOnBranch,
  formatBranchCreateQuota,
  formatBranchMenuQuota,
  formatBranchQuota,
  formatBranchQuotaSubtitle,
  formatBranchQuotaUsageFraction,
  packageIncludedBranchSlots,
  summarizePurchasedBranchUsage,
  type BranchItem,
  type BranchMenuQuota,
  type BranchQuota,
} from "./branch";

function branch(overrides: Partial<BranchItem> = {}): BranchItem {
  return {
    id: 1,
    userId: 7,
    name: "Kadıköy",
    grandfathered: false,
    active: true,
    menus: [],
    ...overrides,
  };
}

function quota(overrides: Partial<BranchQuota> = {}): BranchQuota {
  return {
    used: 0,
    allowed: 1,
    remaining: 1,
    grandfathered: 0,
    extraPurchased: 0,
    canCreate: true,
    ...overrides,
  };
}

describe("summarizePurchasedBranchUsage", () => {
  it("uses allowed minus extraPurchased as base slots, not package+grandfathered twice", () => {
    const exhausted = quota({
      used: 8,
      allowed: 8,
      remaining: 0,
      grandfathered: 1,
      extraPurchased: 7,
      canCreate: false,
    });
    expect(packageIncludedBranchSlots(exhausted)).toBe(1);
    expect(summarizePurchasedBranchUsage(exhausted)).toEqual({
      purchased: 7,
      used: 7,
      remaining: 0,
    });
    expect(formatBranchQuotaUsageFraction(exhausted)).toBe("0/7");
    expect(formatBranchQuotaSubtitle(exhausted)).toBe("Satın alınan şube hakkı");
  });

  it("counts unused purchased slots after the included base slot is filled", () => {
    const partial = quota({
      used: 3,
      allowed: 8,
      remaining: 5,
      grandfathered: 0,
      extraPurchased: 7,
      canCreate: true,
    });
    expect(summarizePurchasedBranchUsage(partial)).toEqual({
      purchased: 7,
      used: 2,
      remaining: 5,
    });
    expect(formatBranchQuotaUsageFraction(partial)).toBe("5/7");
  });

  it("shows package remaining when no add-ons were purchased", () => {
    const includedOnly = quota({
      used: 0,
      allowed: 1,
      remaining: 1,
      extraPurchased: 0,
      canCreate: true,
    });
    expect(formatBranchQuotaSubtitle(includedOnly)).toBe("Paket dahil 1 şube");
    expect(formatBranchQuotaUsageFraction(includedOnly)).toBe("1/1");
  });
});

describe("formatBranchQuota", () => {
  it("describes remaining and exhausted branch slots", () => {
    const remaining = quota({
      used: 1,
      allowed: 2,
      remaining: 1,
      grandfathered: 1,
      extraPurchased: 1,
      canCreate: true,
    });
    const exhausted = { ...remaining, remaining: 0, canCreate: false };
    expect(formatBranchQuota(remaining)).toBe("1 şube hakkınız kaldı");
    expect(formatBranchQuota(exhausted)).toBe("Şube hakkınız doldu. Ek şube ücretlidir.");
  });
});

describe("formatBranchCreateQuota", () => {
  it("describes branch creation quota for the branch entry screen", () => {
    const remaining: BranchQuota = {
      used: 1,
      allowed: 2,
      remaining: 1,
      grandfathered: 0,
      extraPurchased: 0,
      canCreate: true,
    };

    expect(formatBranchCreateQuota(remaining)).toBe("Şube oluşturma hakkınız: 1/2");
    expect(formatBranchCreateQuota({ ...remaining, remaining: 0, canCreate: false })).toBe(
      "Şube ekleme hakkınız bitti. Satın alın.",
    );
  });
});

describe("formatBranchMenuQuota", () => {
  it("describes extra menu remaining", () => {
    const remaining: BranchMenuQuota = {
      extraUsed: 0,
      extraAllowed: 2,
      extraRemaining: 2,
      canCreateExtra: true,
    };
    expect(formatBranchMenuQuota(remaining)).toBe("2 ek menü hakkınız kaldı");
    expect(formatBranchMenuQuota({ ...remaining, extraRemaining: 0, canCreateExtra: false })).toBe(
      "Ek menü hakkınız yok. Her şubenin ilk menüsü ücretsizdir.",
    );
  });
});

describe("canCreateMenuOnBranch", () => {
  it("allows first menu without extra quota", () => {
    expect(branchAllowsFirstMenu(branch())).toBe(true);
    expect(canCreateMenuOnBranch(branch(), { extraUsed: 0, extraAllowed: 0, extraRemaining: 0, canCreateExtra: false })).toBe(true);
  });

  it("requires extra quota when the branch already has an active menu", () => {
    const occupied = branch({
      menus: [{ menuId: 3, qrId: 8, businessName: "Akşam", active: true }],
    });
    expect(branchAllowsFirstMenu(occupied)).toBe(false);
    expect(canCreateMenuOnBranch(occupied, { extraUsed: 0, extraAllowed: 0, extraRemaining: 0, canCreateExtra: false })).toBe(false);
    expect(canCreateMenuOnBranch(occupied, { extraUsed: 0, extraAllowed: 1, extraRemaining: 1, canCreateExtra: true })).toBe(true);
  });
});
