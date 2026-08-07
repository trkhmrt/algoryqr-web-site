import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kayıt Ol",
  description:
    "AlgoryQR'a ücretsiz kaydolun. Dinamik QR, dijital menü, Akıllı Özet, Asistan ve Raporlama ile başlayın.",
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
