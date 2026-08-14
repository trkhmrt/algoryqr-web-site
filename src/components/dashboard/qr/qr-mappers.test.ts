import { describe, expect, it } from "vitest";

import { mapUserQrToDashboardItem } from "@/components/dashboard/qr/qr-mappers";
import type { UserQrApiItem } from "@/lib/api/qr";

describe("mapUserQrToDashboardItem", () => {
  it("maps package context fields for legacy and active QR items", () => {
    const activeQr: UserQrApiItem = {
      qrId: 1,
      userId: 7,
      qrName: "Aktif QR",
      imgSrc: "img",
      details: { url: "https://example.com" },
      createdAt: "2026-01-01T00:00:00.000Z",
      purchaseId: 10,
      packageName: "Ultimate",
      legacy: false,
      activePackage: true,
    };
    const legacyQr: UserQrApiItem = {
      qrId: 2,
      userId: 7,
      qrName: "Eski QR",
      imgSrc: "img",
      details: { url: "https://legacy.example.com" },
      createdAt: "2025-01-01T00:00:00.000Z",
      purchaseId: 99,
      packageName: "Pro",
      legacy: true,
      activePackage: false,
    };

    expect(mapUserQrToDashboardItem(activeQr)).toMatchObject({
      id: 1,
      packageName: "Ultimate",
      legacy: false,
      activePackage: true,
      active: true,
    });
    expect(mapUserQrToDashboardItem(legacyQr)).toMatchObject({
      id: 2,
      packageName: "Pro",
      legacy: true,
      activePackage: false,
    });
  });
});
