import { describe, expect, it } from "vitest";

import { markdownToHtmlForTest } from "./smart-report-pdf";

describe("smart-report-pdf helpers", () => {
  it("converts markdown headings", () => {
    const html = markdownToHtmlForTest("# Başlık\n\n- madde");
    expect(html).toMatch(/<h1\b/);
    expect(html).toMatch(/<li\b/);
    expect(html).toContain("Başlık");
    expect(html).toContain("madde");
  });
});
