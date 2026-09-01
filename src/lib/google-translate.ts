export const TRANSLATE_SOURCE = "tr";

export const TRANSLATE_TARGETS = ["en", "ru", "ar"] as const;

// Food names need a small glossary because isolated words can be ambiguous
// to a general-purpose translator (for example, Turkish "makarna").
const FOOD_TRANSLATION_GLOSSARY: Record<string, string> = {
  makarna: "pasta",
  makarnalar: "Pasta",
  kek: "cake",
};

export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

export const GOOGLE_TRANSLATE_CHUNK_SIZE = 128;

export const TRANSLATE_MAX_TEXTS_PER_REQUEST = 500;

const TARGET_SET = new Set<string>(TRANSLATE_TARGETS);

export function isTranslateTarget(value: string): value is TranslateTarget {
  return TARGET_SET.has(value);
}

export function uniqueTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of texts) {
    const text = raw.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

export function chunkTexts(
  texts: string[],
  size = GOOGLE_TRANSLATE_CHUNK_SIZE,
): string[][] {
  if (size <= 0) return [texts];
  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += size) {
    chunks.push(texts.slice(i, i + size));
  }
  return chunks;
}

export function lookupTranslation(dict: Record<string, string>, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  return dict[trimmed] ?? text;
}

export function applyTranslationGlossary(
  target: TranslateTarget,
  source: string,
  translated: string,
): string {
  if (target !== "en") return translated;
  return FOOD_TRANSLATION_GLOSSARY[source.trim().toLocaleLowerCase("tr-TR")] ?? translated;
}

export type GoogleTranslatePayload = {
  data?: {
    translations?: Array<{ translatedText?: string }>;
  };
};

export function zipTranslations(
  sources: string[],
  translated: Array<{ translatedText?: string } | undefined> | undefined,
): Record<string, string> {
  const rows = translated ?? [];
  const out: Record<string, string> = {};
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const dest = rows[i]?.translatedText?.trim();
    out[source] = dest || source;
  }
  return out;
}

export type TranslateRequestBody = {
  target: TranslateTarget;
  texts: string[];
};

export type TranslateResponseBody = {
  target: TranslateTarget;
  translations: Record<string, string>;
};
