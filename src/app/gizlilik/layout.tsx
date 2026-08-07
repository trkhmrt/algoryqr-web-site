import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Gizlilik Politikası",
  description: "AlgoryQR gizlilik politikası. Kişisel verilerinizin nasıl korunduğunu öğrenin.",
  path: "/gizlilik",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
