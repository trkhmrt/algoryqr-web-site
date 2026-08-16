"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  Calculator,
  ChefHat,
  CreditCard,
  History,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Monitor,
  Package,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import bgProducts from "@/assets/bg-products.jpg";
import { RequireScope } from "@/components/auth/RequireScope";
import { ReportIssueCard } from "@/components/dashboard/ReportIssueCard";
import type { ProductScope } from "@/lib/auth-user";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type OverviewTile = {
  title: string;
  href: string;
  icon: LucideIcon;
  span?: boolean;
  image?: string;
  requiredScope?: ProductScope;
};

const TILES: OverviewTile[] = [
  {
    title: "Muhasebe",
    href: DASHBOARD_ROUTES.muhasebe,
    icon: Calculator,
    span: true,
  },
  {
    title: "Açık oturumlar",
    href: DASHBOARD_ROUTES.accountSessions,
    icon: Monitor,
  },
  {
    title: "Abonelik",
    href: DASHBOARD_ROUTES.accountSubscription,
    icon: Package,
  },
  {
    title: "Geri bildirimler",
    href: DASHBOARD_ROUTES.feedback,
    icon: MessageSquare,
    span: true,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    title: "Güvenlik",
    href: DASHBOARD_ROUTES.accountSecurity,
    icon: Shield,
  },
  {
    title: "Ürünler",
    href: DASHBOARD_ROUTES.digitalMenuProducts,
    icon: ChefHat,
    image: bgProducts.src,
    requiredScope: "QR_MENU_OWNER",
  },
  {
    title: "Bekleyen siparişler",
    href: DASHBOARD_ROUTES.waiter,
    icon: BellRing,
    span: true,
    requiredScope: "WAITER_PANEL_OWNER",
  },
  {
    title: "Ödeme geçmişi",
    href: DASHBOARD_ROUTES.accountPaymentHistory,
    icon: History,
  },
  {
    title: "Kayıtlı kartlar",
    href: DASHBOARD_ROUTES.accountPaymentMethods,
    icon: CreditCard,
  },
  {
    title: "Akıllı raporlar",
    href: DASHBOARD_ROUTES.smartReports,
    icon: Sparkles,
    span: true,
    requiredScope: "SMART_REPORTING_OWNER",
  },
  {
    title: "Restoran düzeni",
    href: DASHBOARD_ROUTES.restaurantLayout,
    icon: LayoutGrid,
    requiredScope: "WAITER_PANEL_OWNER",
  },
  {
    title: "Fatura adresleri",
    href: DASHBOARD_ROUTES.accountBillingAddresses,
    icon: MapPin,
  },
];

function Tile({
  title,
  href,
  icon: Icon,
  span,
  image,
  onNavigate,
}: OverviewTile & { onNavigate?: (href: string) => void }) {
  const className = `tile-surface group relative overflow-hidden rounded-2xl border border-border/70 p-5 text-left ${
    span ? "md:col-span-2" : ""
  }`;

  const content = (
    <>
      {image ? (
        <img
          src={image}
          alt=""
          aria-hidden
          loading="lazy"
          width={1024}
          height={640}
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 object-cover opacity-70 mix-blend-luminosity transition-transform duration-500 group-hover:scale-105 dark:opacity-25 dark:invert [mask-image:linear-gradient(to_right,transparent,black_65%)]"
        />
      ) : (
        <Icon
          aria-hidden
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-8 -right-6 h-36 w-36 text-foreground/[0.045] transition-transform duration-500 group-hover:scale-105"
        />
      )}

      <span className="relative flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface-muted text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-medium tracking-tight text-foreground">
            {title}
          </span>
        </span>
      </span>
    </>
  );

  if (onNavigate) {
    return (
      <button type="button" onClick={() => onNavigate(href)} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function DashboardOverviewView() {
  const router = useRouter();

  return (
    <div className="animate-fade-in">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Genel Bakış
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Sık kullanılan işlemlere kısayol.</p>
      </header>

      <section aria-label="Kısayollar" className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {TILES.map((tile) => (
          <RequireScope key={tile.href} scope={tile.requiredScope}>
            <Tile {...tile} onNavigate={(href) => router.push(href)} />
          </RequireScope>
        ))}
        <ReportIssueCard />
      </section>
    </div>
  );
}
