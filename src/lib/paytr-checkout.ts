export function paytrCheckoutHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: linear-gradient(160deg, #ffffff 0%, #f7f7f8 58%, #f1f1f2 100%);
  font-family: "Manrope", ui-sans-serif, system-ui, sans-serif;
  color: #0f0f0f;
}
#paytr-checkout-form { width: 100%; max-width: 100%; }
#paytr-checkout-form.responsive { width: 100%; }
#paytriframe { width: 100%; }
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
