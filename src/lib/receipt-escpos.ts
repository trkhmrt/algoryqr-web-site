import { formatReceiptText, type ReceiptPayload } from "@/lib/receipt-ticket";

const ESC = 0x1b;
const GS = 0x1d;

const TURKISH: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

export function foldReceiptAscii(value: string): string {
  return value.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => TURKISH[char] ?? char);
}

export function buildEscPosBuffer(payload: ReceiptPayload, options?: { copies?: number; cut?: boolean }): Buffer {
  const copies = Math.min(5, Math.max(1, options?.copies ?? 1));
  const chunks: number[] = [];
  const push = (...bytes: number[]) => {
    chunks.push(...bytes);
  };
  const text = (value: string) => {
    const folded = foldReceiptAscii(value);
    for (let i = 0; i < folded.length; i += 1) push(folded.charCodeAt(i) & 0xff);
  };
  const line = (value: string) => {
    text(value);
    push(0x0a);
  };

  for (let copy = 0; copy < copies; copy += 1) {
    push(ESC, 0x40);
    push(ESC, 0x61, 1);
    push(ESC, 0x45, 1);
    line(payload.platformLabel);
    push(ESC, 0x45, 0);
    push(ESC, 0x61, 0);
    for (const row of formatReceiptText(payload).split("\n")) {
      line(row);
    }
    push(0x0a, 0x0a);
    if (options?.cut !== false) {
      push(GS, 0x56, 0x00);
    }
  }
  return Buffer.from(chunks);
}
