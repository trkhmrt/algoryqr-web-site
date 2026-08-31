import { describe, expect, it } from "vitest";

import {
  convertAmount,
  formatDisplayPrice,
  normalizeCurrency,
  parseMenuPrice,
} from "./menu-exchange-rates";

const SAMPLE_RATES = {
  TRY: 1,
  USD: 0.029,
  EUR: 0.027,
  GBP: 0.023,
  RUB: 2.65,
};

describe("normalizeCurrency", () => {
  it("maps TL to TRY", () => {
    expect(normalizeCurrency("tl")).toBe("TRY");
  });

  it("uppercases codes", () => {
    expect(normalizeCurrency("usd")).toBe("USD");
  });
});

describe("parseMenuPrice", () => {
  it("parses numeric strings", () => {
    expect(parseMenuPrice("120.5")).toBe(120.5);
  });

  it("returns null for invalid values", () => {
    expect(parseMenuPrice(undefined)).toBeNull();
    expect(parseMenuPrice("abc")).toBeNull();
  });
});

describe("convertAmount", () => {
  it("returns same amount when currencies match", () => {
    expect(convertAmount(100, "TRY", "TRY", SAMPLE_RATES)).toBe(100);
  });

  it("converts TRY to USD", () => {
    expect(convertAmount(100, "TRY", "USD", SAMPLE_RATES)).toBeCloseTo(2.9, 5);
  });

  it("converts USD to TRY", () => {
    expect(convertAmount(2.9, "USD", "TRY", SAMPLE_RATES)).toBeCloseTo(100, 1);
  });

  it("converts EUR to USD via TRY base", () => {
    expect(convertAmount(10, "EUR", "USD", SAMPLE_RATES)).toBeCloseTo(10 / 0.027 * 0.029, 5);
  });

  it("handles TL alias as source currency", () => {
    expect(convertAmount(100, "TL", "USD", SAMPLE_RATES)).toBeCloseTo(2.9, 5);
  });

  it("returns original amount when rate is missing", () => {
    expect(convertAmount(50, "JPY", "USD", SAMPLE_RATES)).toBe(50);
  });
});

describe("formatDisplayPrice", () => {
  it("formats TRY with tr locale", () => {
    const formatted = formatDisplayPrice(1200.5, "TRY", "tr");
    expect(formatted).toContain("1.200");
  });

  it("formats USD with en locale", () => {
    const formatted = formatDisplayPrice(12.5, "USD", "en");
    expect(formatted).toMatch(/\$12\.50/);
  });
});
