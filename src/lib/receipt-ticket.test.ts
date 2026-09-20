import { describe, expect, it } from "vitest";

import { buildEscPosBuffer, foldReceiptAscii } from "./receipt-escpos";
import { formatReceiptText, marketplaceOrderToReceipt } from "./receipt-ticket";

describe("receipt ticket", () => {
  it("builds marketplace receipt fields", () => {
    const payload = marketplaceOrderToReceipt(
      {
        id: 1,
        externalOrderId: "PKG-9",
        orderNumber: "YS-100",
        customerName: "Ayşe",
        items: [{ productName: "Adana", quantity: 2, unitPrice: 180, detail: "Acılı" }],
        totalAmount: 360,
        currency: "TRY",
      },
      "YEMEK_SEPETI",
    );
    const text = formatReceiptText(payload);
    expect(payload.platformLabel).toBe("Yemek Sepeti");
    expect(text).toContain("YS-100");
    expect(text).toContain("2x Adana");
    expect(text).toContain("Acılı");
  });

  it("encodes ESC/POS init and cut", () => {
    const buffer = buildEscPosBuffer(
      {
        platformLabel: "Test",
        orderNumber: "1",
        items: [{ quantity: 1, name: "Çorba" }],
      },
      { copies: 1, cut: true },
    );
    expect(buffer[0]).toBe(0x1b);
    expect(buffer[1]).toBe(0x40);
    expect(foldReceiptAscii("Çorba")).toBe("Corba");
    expect(buffer.includes(0x1d)).toBe(true);
  });
});
