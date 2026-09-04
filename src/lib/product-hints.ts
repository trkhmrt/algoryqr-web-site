import type { ProductCode } from "@/lib/auth-user";

export type FeatureHintContent = {
  title: string;
  description: string;
};

/** Catalog product codes shown in package comparison and feature panels. */
export type CatalogProductCode =
  | "QR_CREATE"
  | "QR_MENU"
  | "QR_BRANCH"
  | "MENU_PRODUCT"
  | "SMART_REPORTING"
  | "SMART_ASSISTANT"
  | "SMART_SUMMARY"
  | "CUSTOM_DESIGN"
  | "WAITER_PANEL"
  | "AI_MENU_IMPORT";

const PRODUCT_CODE_ALIASES: Record<string, CatalogProductCode> = {
  QR_CREATE: "QR_CREATE",
  QR_MENU: "QR_MENU",
  QR_BRANCH: "QR_BRANCH",
  MENU_PRODUCT: "MENU_PRODUCT",
  SMART_REPORTING: "SMART_REPORTING",
  QR_ANALYTICS: "SMART_REPORTING",
  SMART_ASSISTANT: "SMART_ASSISTANT",
  QR_AGENT: "SMART_ASSISTANT",
  SMART_SUMMARY: "SMART_SUMMARY",
  CUSTOM_DESIGN: "CUSTOM_DESIGN",
  WAITER_PANEL: "WAITER_PANEL",
  AI_MENU_IMPORT: "AI_MENU_IMPORT",
};

export const PRODUCT_HINTS: Record<CatalogProductCode, FeatureHintContent> = {
  QR_CREATE: {
    title: "QR oluşturma nedir?",
    description:
      "Bu paketle oluşturabileceğiniz dinamik QR kod adedini belirtir. QR kodlar menü, kampanya veya bilgi sayfalarınıza yönlendirir.",
  },
  QR_MENU: {
    title: "Dijital menü nedir?",
    description:
      "Her şubede bir ücretsiz menü oluşturabilirsiniz. Aynı şubeye ek menü eklemek ücretlidir.",
  },
  QR_BRANCH: {
    title: "Şube nedir?",
    description:
      "Paketiniz bir ücretsiz şube hakkı verir. Ek şube satın alarak birden fazla lokasyonu ayrı yönetebilirsiniz.",
  },
  MENU_PRODUCT: {
    title: "Menü ürün hakkı nedir?",
    description:
      "Dijital menünüzde tanımlayabileceğiniz ürün adedini belirtir. Her ürün için fiyat, açıklama ve görsel ekleyebilirsiniz.",
  },
  SMART_REPORTING: {
    title: "Akıllı Rapor nedir?",
    description:
      "Seçtiğiniz menü ve dönem için ziyaret verilerinizi yapay zeka analiz eder; özet, içgörü ve öneriler üretir. Hazır raporu PDF olarak indirebilir veya geçmişten tekrar açabilirsiniz.",
  },
  SMART_ASSISTANT: {
    title: "Akıllı Asistan nedir?",
    description:
      "Menüdeki misafirlere yapay zeka ile öneri ve yanıt sunar. Sorulara anında cevap vererek sipariş deneyimini kolaylaştırır.",
  },
  SMART_SUMMARY: {
    title: "Akıllı Özet nedir?",
    description:
      "Ürün adı, kategori ve etiketlerinize göre yapay zeka destekli açıklama üretir. Sonucu doğrudan açıklama alanına yazar.",
  },
  CUSTOM_DESIGN: {
    title: "Özel tasarım menü nedir?",
    description:
      "Markanıza özel butik menü tasarımı hazırlama ve uygulama imkânı. Hazır şablonların ötesinde marka kimliğinize uygun görünüm.",
  },
  WAITER_PANEL: {
    title: "Garson paneli nedir?",
    description:
      "Garsonların masa, sipariş ve adisyon süreçlerini yönettiği panel erişimi. Sipariş cirosu ve satış raporları bu modül üzerinden takip edilir.",
  },
  AI_MENU_IMPORT: {
    title: "AI menü import nedir?",
    description:
      "Menü fotoğraflarından ürünleri yapay zeka ile çıkarır; açıklama ve besin değerlerini üretir. Taslakları inceleyip onayladıktan sonra menünüze eklenir. Yalnızca Ultimate paket.",
  },
};

export function normalizeCatalogProductCode(code: string): CatalogProductCode | null {
  return PRODUCT_CODE_ALIASES[code] ?? null;
}

export function getProductHint(productCode: string): FeatureHintContent | null {
  const normalized = normalizeCatalogProductCode(productCode);
  if (!normalized) return null;
  return PRODUCT_HINTS[normalized];
}

export function getProductHintByCode(code: ProductCode | CatalogProductCode | string): FeatureHintContent {
  return getProductHint(code) ?? {
    title: "Özellik nedir?",
    description: "Bu paketin ilgili ürünü hakkında kısa bilgi.",
  };
}
