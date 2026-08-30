export function paytrCheckoutHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; background: #fff; }
#paytr-checkout-form { width: 100%; max-width: 100%; }
#paytr-checkout-form.responsive { width: 100%; }
</style>
</head>
<body>
<div id="paytr-checkout-form" class="responsive">${content}</div>
</body>
</html>`;
}

export function isPaytrCheckout(
  overlay: { kind: "url" | "html"; content: string } | null,
): boolean {
  if (!overlay) {
    return false;
  }
  return overlay.kind === "html" || /paytr\.com/i.test(overlay.content);
}
