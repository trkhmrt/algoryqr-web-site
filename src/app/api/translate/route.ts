import { NextResponse } from "next/server";
import { z } from "zod";

import {
  TRANSLATE_SOURCE,
  TRANSLATE_MAX_TEXTS_PER_REQUEST,
  chunkTexts,
  applyTranslationGlossary,
  isTranslateTarget,
  uniqueTexts,
  zipTranslations,
  type GoogleTranslatePayload,
  type TranslateResponseBody,
} from "@/lib/google-translate";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 20_000;

const bodySchema = z.object({
  target: z.string(),
  texts: z.array(z.string()).max(TRANSLATE_MAX_TEXTS_PER_REQUEST),
});

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const translationCache = new Map<string, CacheEntry>();

function cacheKey(target: string, text: string): string {
  return `${target}\0${text}`;
}

function readCache(target: string, text: string): string | undefined {
  const entry = translationCache.get(cacheKey(target, text));
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    translationCache.delete(cacheKey(target, text));
    return undefined;
  }
  return entry.value;
}

function writeCache(target: string, text: string, value: string) {
  if (translationCache.size >= CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of translationCache) {
      if (entry.expiresAt < now) translationCache.delete(key);
    }
  }
  if (translationCache.size >= CACHE_MAX_ENTRIES) {
    const first = translationCache.keys().next().value;
    if (first) translationCache.delete(first);
  }
  translationCache.set(cacheKey(target, text), {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function translateChunk(
  apiKey: string,
  target: string,
  texts: string[],
): Promise<Record<string, string>> {
  const response = await fetch("https://translation.googleapis.com/language/translate/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      q: texts,
      source: TRANSLATE_SOURCE,
      target,
      format: "text",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`google-translate-http-${response.status}`);
  }

  const payload = (await response.json()) as GoogleTranslatePayload;
  return zipTranslations(texts, payload.data?.translations);
}

export async function POST(request: Request) {
  const apiKey = process.env.Google_Cloud_Translate_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: "Translation service unavailable" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid translate request" }, { status: 400 });
  }

  const target = parsed.data.target;
  if (!isTranslateTarget(target)) {
    return NextResponse.json({ message: "Unsupported target locale" }, { status: 400 });
  }

  const texts = uniqueTexts(parsed.data.texts);
  if (texts.length === 0) {
    const empty: TranslateResponseBody = { target, translations: {} };
    return NextResponse.json(empty);
  }

  const translations: Record<string, string> = {};
  const missing: string[] = [];
  for (const text of texts) {
    const cached = readCache(target, text);
    if (cached != null) {
      translations[text] = applyTranslationGlossary(target, text, cached);
    } else {
      missing.push(text);
    }
  }

  try {
    for (const chunk of chunkTexts(missing)) {
      const chunkResult = await translateChunk(apiKey, target, chunk);
      for (const [source, value] of Object.entries(chunkResult)) {
        translations[source] = applyTranslationGlossary(target, source, value);
        writeCache(target, source, value);
      }
    }
  } catch {
    return NextResponse.json({ message: "Translation fetch failed" }, { status: 502 });
  }

  const body: TranslateResponseBody = { target, translations };
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
