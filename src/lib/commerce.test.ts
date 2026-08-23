import { describe, expect, it } from "vitest";

import {
  billingAddressSchema,
  buildBillingAddressPayload,
  calculateTrialDaysRemaining,
  cardSchema,
  checkoutSchema,
  DEFAULT_IDENTITY_NUMBER,
  formatCardNumber,
  getBin,
  mapTrialStatus,
} from "./commerce";

describe("commerce schemas and logic", () => {
  it("validates a real individual billing address", () => {
    const result = billingAddressSchema.safeParse({
      type: "INDIVIDUAL",
      title: "Ev",
      name: "Tarık",
      surname: "Hamarat",
      tckn: "10000000146",
      country: "Türkiye",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      defaultAddress: true,
    });

    expect(result.success).toBe(true);
  });

  it("allows individual addresses without TCKN", () => {
    const result = billingAddressSchema.safeParse({
      type: "INDIVIDUAL",
      title: "Ev",
      name: "Tarık",
      surname: "Hamarat",
      tckn: "",
      country: "Türkiye",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      defaultAddress: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects incomplete TCKN when provided", () => {
    const result = billingAddressSchema.safeParse({
      type: "INDIVIDUAL",
      title: "Ev",
      name: "Tarık",
      surname: "Hamarat",
      tckn: "123",
      country: "Türkiye",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      defaultAddress: true,
    });

    expect(result.success).toBe(false);
  });

  it("defaults missing TCKN and nulls unused corporate fields for individual addresses", () => {
    const payload = buildBillingAddressPayload({
      type: "INDIVIDUAL",
      title: "Ev",
      name: "Tarik",
      surname: "Hamarat",
      legalName: "",
      tckn: "",
      vkn: "1234567890",
      taxOffice: "",
      mersis: "",
      country: "Turkiye",
      city: "Istanbul",
      district: "Kadikoy",
      address: "Caferaga Mahallesi Moda Caddesi No 1",
      postcode: "34710",
      email: "tarik@example.com",
      phone: "+905551112233",
      defaultAddress: true,
    });

    expect(payload.vkn).toBeNull();
    expect(payload.tckn).toBe(DEFAULT_IDENTITY_NUMBER);
    expect(payload.taxpayerInvoice).toBe(false);
    expect(payload.legalName).toBeNull();
    expect(payload.name).toBe("Tarik");
    expect(payload.title).toBe("Ev");
  });

  it("persists provided TCKN for individual addresses", () => {
    const payload = buildBillingAddressPayload({
      type: "INDIVIDUAL",
      title: "Ev",
      name: "Tarik",
      surname: "Hamarat",
      legalName: "",
      tckn: "10000000146",
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
      defaultAddress: true,
    });

    expect(payload.tckn).toBe("10000000146");
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

  it("allows checkout without recurring consent", () => {
    const result = checkoutSchema.safeParse({
      billingPeriod: "MONTHLY",
      billingAddressId: 1,
      recurringConsent: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurringConsent).toBe(false);
    }
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
