/**
 * When product cards are shown, strip duplicated product bullet/numbered lists
 * from the assistant reply so the bubble stays a short intro/closing.
 */

const LIST_ITEM_RE =
  /^\s*(?:[-*•▪︎‣]|\d+[\).\]]|[a-zA-ZçğıöşüÇĞİÖŞÜ][\).\]])\s+/u;

const PRICE_IN_LINE_RE =
  /(?:₺|\bTL\b|\bTRY\b|\d+(?:[.,]\d{1,2})?\s*(?:₺|TL|TRY)\b)/iu;

function normalizeForMatch(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function lineMentionsKnownProduct(
  line: string,
  productNames: string[],
): boolean {
  const normalizedLine = normalizeForMatch(line);
  if (!normalizedLine) return false;
  return productNames.some((name) => {
    const normalizedName = normalizeForMatch(name);
    return normalizedName.length >= 2 && normalizedLine.includes(normalizedName);
  });
}

function isProductListLine(line: string, productNames: string[]): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const looksLikeList = LIST_ITEM_RE.test(trimmed);
  const hasPrice = PRICE_IN_LINE_RE.test(trimmed);
  const mentionsProduct = lineMentionsKnownProduct(trimmed, productNames);

  if (looksLikeList && (hasPrice || mentionsProduct)) return true;
  if (!looksLikeList && hasPrice && mentionsProduct) return true;
  return false;
}

function isListLeadIn(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return /(?:şunlar(?:ı|ı)?|şu ürünler|önerilerim|önerebileceğim|önerebilirim|menüden|seçenekler|tavsiyelerim)\s*:?\s*$/iu.test(
    trimmed,
  );
}

/**
 * Returns display text for an assistant reply when cards will render products.
 * Falls back to a short default if stripping leaves nothing useful.
 */
export function stripProductListFromReply(
  reply: string,
  productNames: string[],
): string {
  const text = reply.trim();
  if (!text || productNames.length === 0) return text;

  const lines = text.split(/\r?\n/);
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (isProductListLine(line, productNames)) continue;

    // Drop a lead-in line that only introduces the list (e.g. "Önerilerim:")
    // when the following content was/is a product list.
    if (isListLeadIn(line)) {
      const nextMeaningful = lines.slice(i + 1).find((l) => l.trim().length > 0);
      if (!nextMeaningful || isProductListLine(nextMeaningful, productNames)) {
        continue;
      }
    }

    kept.push(line);
  }

  const cleaned = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || "Menüden birkaç seçenek önerdim.";
}
