import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "İade ve İptal",
  description: "AlgoryQR iade ve iptal politikası. Paket ve abonelik koşullarını inceleyin.",
  path: "/iade",
});

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
