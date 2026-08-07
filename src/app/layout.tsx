import type { Metadata } from "next";

import "./globals.css";
import Providers from "@/components/providers";
import JsonLd from "@/components/JsonLd";
import {
  buildMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={softwareApplicationJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
