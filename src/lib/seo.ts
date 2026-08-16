import type { Metadata } from "next";

import { COMPANY } from "@/lib/company";

function resolveSiteUrl(): string {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "https://qr.algorycode.com";
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = COMPANY.productName;

export const DEFAULT_TITLE = `${SITE_NAME} | QR Menü, Akıllı Özet ve Dijital İşletme Platformu`;

export const DEFAULT_DESCRIPTION =
  "AlgoryQR ile dinamik QR kodlar, dijital menü, Akıllı Özet, Akıllı Asistan ve Akıllı Raporlama. Restoran ve işletmeler için yapay zeka destekli QR platformu.";

export const DEFAULT_KEYWORDS = [
  "AlgoryQR",
  "QR kod",
  "dijital menü",
  "QR menü",
  "yapay zeka",
  "akıllı özet",
  "akıllı asistan",
  "akıllı raporlama",
  "dinamik QR",
  "restoran menü QR",
  "QR oluşturma",
] as const;

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const pageTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(SITE_URL),
    title: pageTitle,
    description,
    keywords: [...DEFAULT_KEYWORDS],
    authors: [{ name: COMPANY.tradeName }],
    creator: COMPANY.tradeName,
    publisher: COMPANY.tradeName,
    alternates: {
      canonical: url,
    },
    icons: {
      icon: [
        { url: "/brand/favicon-16.png?v=15", sizes: "16x16", type: "image/png" },
        { url: "/brand/favicon-32.png?v=15", sizes: "32x32", type: "image/png" },
      ],
      apple: "/brand/apple-touch-icon.png?v=15",
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — QR menü ve yapay zeka özellikleri`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ["/og-image.png"],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.tradeName,
    url: SITE_URL,
    email: COMPANY.email,
    telephone: COMPANY.phoneTel.replace("tel:", ""),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    logo: absoluteUrl("/brand/algory-logo.png"),
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      description: "Ücretsiz başlangıç paketi mevcuttur",
    },
    featureList: [
      "Dinamik QR kod oluşturma",
      "Dijital menü şablonları",
      "Akıllı Özet",
      "Akıllı Asistan",
      "Akıllı Raporlama",
    ],
    provider: {
      "@type": "Organization",
      name: COMPANY.tradeName,
      email: COMPANY.email,
    },
  };
}

export function faqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
