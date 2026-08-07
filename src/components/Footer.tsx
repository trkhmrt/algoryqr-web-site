import Link from "next/link";
import { QrCode } from "lucide-react";

import PaymentBadges from "@/components/PaymentBadges";
import { COMPANY } from "@/lib/company";

const LEGAL_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/gizlilik", label: "Gizlilik" },
  { href: "/mesafeli-satis", label: "Mesafeli satış" },
  { href: "/iade", label: "İade" },
  { href: "/contact", label: "İletişim" },
] as const;

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto space-y-10 px-4">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                Algory<span className="text-primary">QR</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Dinamik QR, dijital menü ve yapay zeka destekli işletme araçları.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 {COMPANY.productName}. Tüm hakları saklıdır.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Yasal
            </p>
            <nav className="flex flex-col gap-2">
              {LEGAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              İletişim
            </p>
            <p className="text-sm font-medium text-foreground">{COMPANY.tradeName}</p>
            <a
              href={COMPANY.emailMailto}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {COMPANY.email}
            </a>
          </div>
        </div>

        <PaymentBadges />
      </div>
    </footer>
  );
};

export default Footer;
