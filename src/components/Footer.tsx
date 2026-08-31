"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import PaymentBadges from "@/components/PaymentBadges";
import { BrandLogo } from "@/components/BrandLogo";
import { FooterThemeToggle } from "@/components/ThemeToggle";
import { COMPANY } from "@/lib/company";
import { Tx, useT } from "@/components/google-translate-provider";

const LEGAL_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/gizlilik", label: "Gizlilik" },
  { href: "/mesafeli-satis", label: "Mesafeli satış" },
  { href: "/iade", label: "İade" },
  { href: "/contact", label: "İletişim" },
] as const;

const Footer = () => {
  const t = useT();

  return (
    <footer className="border-t border-border py-8 sm:py-10 md:py-12">
      <div className="container mx-auto w-full max-w-6xl space-y-8 sm:space-y-10 px-4 sm:px-6">
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="space-y-3 min-[480px]:col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <BrandLogo />
              <span className="font-semibold">
                Algory<span className="text-primary">QR</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs text-pretty">
              <Tx>Dinamik QR, dijital menü ve yapay zeka destekli işletme araçları.</Tx>
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 {COMPANY.productName}. <Tx>Tüm hakları saklıdır.</Tx>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              <Tx>Yasal</Tx>
            </p>
            <nav className="flex flex-col gap-2">
              {LEGAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground py-0.5"
                >
                  {t(item.label)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              <Tx>İletişim</Tx>
            </p>
            <p className="text-sm font-medium text-foreground">{COMPANY.tradeName}</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{COMPANY.address}</span>
              </div>
              <a
                href={COMPANY.emailMailto}
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="break-all">{COMPANY.email}</span>
              </a>
              <a
                href={COMPANY.phoneTel}
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{COMPANY.phone}</span>
              </a>
            </div>
          </div>
        </div>

        <PaymentBadges />

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">Görünüm tercihinizi buradan değiştirebilirsiniz.</p>
          <FooterThemeToggle />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
