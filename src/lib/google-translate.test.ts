import { describe, expect, it } from "vitest";

import {
  chunkTexts,
  isTranslateTarget,
  lookupTranslation,
  uniqueTexts,
  zipTranslations,
} from "./google-translate";

describe("isTranslateTarget", () => {
  it("accepts en ru ar", () => {
    expect(isTranslateTarget("en")).toBe(true);
    expect(isTranslateTarget("ru")).toBe(true);
    expect(isTranslateTarget("ar")).toBe(true);
  });

  it("rejects tr and unknown", () => {
    expect(isTranslateTarget("tr")).toBe(false);
    expect(isTranslateTarget("de")).toBe(false);
  });
});

describe("uniqueTexts", () => {
  it("trims, drops empties, preserves first order", () => {
    expect(uniqueTexts([" Çorba ", "", "Balık", "Çorba"])).toEqual(["Çorba", "Balık"]);
  });
});

describe("chunkTexts", () => {
  it("splits into sized batches", () => {
    expect(chunkTexts(["a", "b", "c", "d"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("zipTranslations", () => {
  it("maps sources to translated text in order", () => {
    expect(
      zipTranslations(["Çorba", "Balık"], [{ translatedText: "Soup" }, { translatedText: "Fish" }]),
    ).toEqual({ Çorba: "Soup", Balık: "Fish" });
  });

  it("falls back to source when translation is missing", () => {
    expect(zipTranslations(["Çorba"], [{}])).toEqual({ Çorba: "Çorba" });
  });
});

describe("lookupTranslation", () => {
  it("returns original when dict has no entry", () => {
    expect(lookupTranslation({}, "Çorba")).toBe("Çorba");
  });

  it("returns mapped value", () => {
    expect(lookupTranslation({ Çorba: "Soup" }, " Çorba ")).toBe("Soup");
  });
});
