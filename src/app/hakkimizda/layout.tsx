import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Hakkımızda",
  description:
    "AlgoryCode ve AlgoryQR hakkında bilgi edinin. Dinamik QR, dijital menü, Akıllı Özet, Akıllı Asistan ve Akıllı Raporlama ile işletmenizi güçlendirin.",
  path: "/hakkimizda",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
