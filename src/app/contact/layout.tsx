import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "İletişim",
  description:
    "AlgoryQR ile iletişime geçin. QR menü, dijital menü ve yapay zeka özellikleri hakkında destek alın.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
