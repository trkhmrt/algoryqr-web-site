import { describe, expect, it } from "vitest";

import { isCardVerificationComplete, isCardVerificationFailed } from "./card-verification";

describe("card verification status helpers", () => {
  it("treats SUCCESS as complete", () => {
    expect(isCardVerificationComplete("SUCCESS")).toBe(true);
  });

  it("treats REFUNDED as complete (nominal charge auto-reversed after tokenization)", () => {
    expect(isCardVerificationComplete("REFUNDED")).toBe(true);
  });

  it("treats INITIATED as not complete", () => {
    expect(isCardVerificationComplete("INITIATED")).toBe(false);
  });

  it("treats undefined as not complete", () => {
    expect(isCardVerificationComplete(undefined)).toBe(false);
  });

  it("treats FAILURE as failed", () => {
    expect(isCardVerificationFailed("FAILURE")).toBe(true);
  });

  it("does not treat SUCCESS or REFUNDED as failed", () => {
    expect(isCardVerificationFailed("SUCCESS")).toBe(false);
    expect(isCardVerificationFailed("REFUNDED")).toBe(false);
  });
});
