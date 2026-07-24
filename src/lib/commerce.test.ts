import { describe, expect, it } from "vitest";

import {
  billingAddressSchema,
  buildBillingAddressPayload,
  calculateTrialDaysRemaining,
  cardSchema,
  checkoutSchema,
  formatCardNumber,
  getBin,
  mapTrialStatus,
} from "./commerce";

describe("commerce schemas and logic", () => {
  it("validates a real individual billing address", () => {
    const result = billingAddressSchema.safeParse({
      type: "INDIVIDUAL",
      name: "Tarık",
      surname: "Hamarat",
      country: "Türkiye",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      taxpayerInvoice: false,
      defaultAddress: true,
    });

    expect(result.success).toBe(true);
  });

  it("nulls unused identity fields for individual addresses", () => {
    const payload = buildBillingAddressPayload({
      type: "INDIVIDUAL",
      name: "Tarik",
      surname: "Hamarat",
      legalName: "",
      tckn: "",
      vkn: "",
      taxOffice: "",
      mersis: "",
      country: "Turkiye",
      city: "Istanbul",
      district: "Kadikoy",
      address: "Caferaga Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      taxpayerInvoice: false,
      defaultAddress: true,
    });

    expect(payload.vkn).toBeNull();
    expect(payload.tckn).toBeNull();
    expect(payload.legalName).toBeNull();
    expect(payload.name).toBe("Tarik");
  });

  it("rejects incomplete card data", () => {
    const result = cardSchema.safeParse({
      cardHolderName: "A",
      cardNumber: "1234",
      expiry: "13/20",
      cvc: "1",
      saveCard: false,
    });

    expect(result.success).toBe(false);
  });

  it("requires recurring consent for subscriptions", () => {
    const result = checkoutSchema.safeParse({
      billingPeriod: "MONTHLY",
      billingAddressId: 1,
      paymentMethodId: "2",
      recurringConsent: false,
    });

    expect(result.success).toBe(false);
  });

  it("formats cards and extracts BIN", () => {
    const formatted = formatCardNumber("5890040000000016");
    expect(formatted).toBe("5890 0400 0000 0016");
    expect(getBin(formatted)).toBe("58900400");
  });

  it("maps trial lifecycle and calculates remaining days", () => {
    const mapped = mapTrialStatus({
      lifecycle: "ACTIVE",
      expiresAt: "2026-07-19T00:00:00.000Z",
      purchaseId: 12,
    });
    expect(mapped.status).toBe("ACTIVE");
    expect(calculateTrialDaysRemaining(mapped, new Date("2026-07-16T00:00:00.000Z"))).toBe(3);
  });
});
