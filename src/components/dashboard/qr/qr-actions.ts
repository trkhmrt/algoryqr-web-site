type ShareQrParams = {
  title: string;
  text: string;
  imgSrc?: string;
  url?: string;
};

export const getQrDataUrl = (imgSrc?: string) => {
  if (!imgSrc) return null;
  return `data:image/png;base64,${imgSrc}`;
};

export const downloadQrImage = (imgSrc: string, fileName: string) => {
  const dataUrl = getQrDataUrl(imgSrc);
  if (!dataUrl) return false;

  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${fileName || "qr-kod"}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return true;
};

export const copyTextToClipboard = async (value: string) => {
  if (!navigator?.clipboard) return false;
  await navigator.clipboard.writeText(value);
  return true;
};

const base64ToBlob = (base64: string, mimeType = "image/png") => {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

export const copyQrImageToClipboard = async (imgSrc?: string) => {
  if (!imgSrc || !navigator?.clipboard || typeof ClipboardItem === "undefined") return false;
  const blob = base64ToBlob(imgSrc, "image/png");
  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
  return true;
};

const base64ToFile = (base64: string, fileName: string) => {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], `${fileName || "qr-kod"}.png`, { type: "image/png" });
};

export const shareQr = async ({ title, text, imgSrc }: ShareQrParams) => {
  if (!navigator?.share) return false;

  if (imgSrc) {
    const file = base64ToFile(imgSrc, title);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    }
  }

  await navigator.share({ title, text });
  return true;
};

export type SharePlatform = "whatsapp" | "facebook" | "x" | "telegram" | "linkedin";

export const buildPlatformShareUrl = (
  platform: SharePlatform,
  payload: { text: string; url?: string }
) => {
  const encodedText = encodeURIComponent(payload.text);
  const encodedUrl = encodeURIComponent(payload.url || "");
  const textAndUrl = payload.url ? `${encodedText}%20${encodedUrl}` : encodedText;

  if (platform === "whatsapp") return `https://wa.me/?text=${textAndUrl}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (platform === "x") return `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  if (platform === "telegram") return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
};
