import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Mesafeli Satış Sözleşmesi",
  description: "AlgoryQR mesafeli satış sözleşmesi ve dijital hizmet koşulları.",
  path: "/mesafeli-satis",
});

export default function DistanceSalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
