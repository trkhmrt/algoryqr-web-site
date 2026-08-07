import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Giriş",
  description: "AlgoryQR hesabınıza giriş yapın. QR menü ve yapay zeka araçlarınızı yönetin.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
