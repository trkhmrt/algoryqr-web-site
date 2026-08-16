import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import Providers from "@/components/providers";
import JsonLd from "@/components/JsonLd";
import {
  buildMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

const geistSans = localFont({
  src: "../../public/fonts/GeistVariableVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVariableVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={softwareApplicationJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
