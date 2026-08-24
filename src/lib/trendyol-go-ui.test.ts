import { describe, expect, it } from "vitest";

import {
  connectionStatusLabel,
  deliveryTypeLabel,
  displayValue,
  formatOrderReference,
  packageStatusLabel,
  paymentMethodLabel,
  shortDisplayId,
} from "@/lib/trendyol-go-ui";

describe("trendyol-go-ui", () => {
  it("translates package statuses to Turkish", () => {
    expect(packageStatusLabel("Created")).toBe("Yeni sipariş");
    expect(packageStatusLabel("Accepted")).toBe("Kabul edildi");
    expect(packageStatusLabel("Prepared")).toBe("Hazır");
    expect(packageStatusLabel("Cancelled")).toBe("İptal edildi");
  });

  it("shortens long order references", () => {
    expect(formatOrderReference("12345678901234567890")).toBe("#34567890");
    expect(formatOrderReference("12345")).toBe("#12345");
  });

  it("shortens long ids for display", () => {
    expect(shortDisplayId("abcdefghijklmnop")).toBe("abcd…mnop");
    expect(shortDisplayId("short")).toBe("short");
  });

  it("translates connection statuses", () => {
    expect(connectionStatusLabel("CONNECTED")).toBe("Bağlı");
    expect(connectionStatusLabel("PENDING_RESTAURANT")).toBe("Restoran seçin");
  });

  it("translates delivery and payment labels", () => {
    expect(deliveryTypeLabel("STORE")).toBe("Restoran teslimat");
    expect(paymentMethodLabel("Online Ödeme")).toBe("Online kredi kartı");
    expect(paymentMethodLabel("Online Kredi Kartı")).toBe("Online kredi kartı");
    expect(displayValue("")).toBe("—");
  });
});
