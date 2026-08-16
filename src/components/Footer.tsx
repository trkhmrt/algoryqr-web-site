import Link from "next/link";
import PaymentBadges from "@/components/PaymentBadges";
import { BrandLogo } from "@/components/BrandLogo";
import { FooterThemeToggle } from "@/components/ThemeToggle";
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
              Dinamik QR, dijital menü ve yapay zeka destekli işletme araçları.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 {COMPANY.productName}. Tüm hakları saklıdır.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              Yasal
            </p>
            <nav className="flex flex-col gap-2">
              {LEGAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground py-0.5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              İletişim
            </p>
            <p className="text-sm font-medium text-foreground">{COMPANY.tradeName}</p>
            <a
              href={COMPANY.emailMailto}
              className="text-sm text-primary underline-offset-4 hover:underline break-all"
            >
              {COMPANY.email}
            </a>
            <a
              href={COMPANY.phoneTel}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {COMPANY.phone}
            </a>
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
