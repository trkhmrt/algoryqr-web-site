export function paytrCheckoutHtml(content: string): string {
  return `<div id="paytr-checkout-form" class="responsive">${content}</div>`;
}

export function isPaytrCheckout(
  overlay: { kind: "url" | "html"; content: string } | null,
): boolean {
  if (!overlay) {
    return false;
  }
  return overlay.kind === "html" || /paytr\.com/i.test(overlay.content);
}
