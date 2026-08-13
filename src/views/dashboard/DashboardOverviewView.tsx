"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  History,
  LayoutGrid,
  MapPin,
  MessageSquareText,
  Monitor,
  Package,
  Receipt,
  Shield,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type ChartToken = "green" | "indigo" | "teal" | "violet" | "orange" | "red";

type OverviewTile = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: ChartToken;
  area: string;
};

const TILES: OverviewTile[] = [
  {
    title: "Ciro",
    description: "Sipariş raporları, günün ürünü ve satış izleme",
    href: DASHBOARD_ROUTES.orderPanelReports,
    icon: Receipt,
    color: "green",
    area: "ciro",
  },
  {
    title: "Açık oturumlar",
    description: "Aktif cihazlar ve girişler",
    href: DASHBOARD_ROUTES.accountSessions,
    icon: Monitor,
    color: "indigo",
    area: "sessions",
  },
  {
    title: "Abonelik",
    description: "Paket ve kullanım durumu",
    href: DASHBOARD_ROUTES.accountSubscription,
    icon: Package,
    color: "violet",
    area: "sub",
  },
  {
    title: "Geri bildirimler",
    description: "Menü ve ürün yorumları",
    href: DASHBOARD_ROUTES.feedback,
    icon: MessageSquareText,
    color: "teal",
    area: "feedback",
  },
  {
    title: "Güvenlik",
    description: "İki faktörlü doğrulama",
    href: DASHBOARD_ROUTES.accountSecurity,
    icon: Shield,
    color: "red",
    area: "security",
  },
  {
    title: "Ürünler",
    description: "Menü ürünlerini düzenle",
    href: DASHBOARD_ROUTES.digitalMenuProducts,
    icon: UtensilsCrossed,
    color: "orange",
    area: "products",
  },
  {
    title: "Bekleyen siparişler",
    description: "Onayla veya reddet",
    href: DASHBOARD_ROUTES.waiter,
    icon: Bell,
    color: "indigo",
    area: "orders",
  },
  {
    title: "Ödeme geçmişi",
    description: "Satın alma kayıtları",
    href: DASHBOARD_ROUTES.accountPaymentHistory,
    icon: History,
    color: "green",
    area: "payment",
  },
  {
    title: "Kayıtlı kartlar",
    description: "Ödeme yöntemleri",
    href: DASHBOARD_ROUTES.accountPaymentMethods,
    icon: CreditCard,
    color: "violet",
    area: "cards",
  },
  {
    title: "Akıllı raporlar",
    description: "Rapor geçmişi ve PDF",
    href: DASHBOARD_ROUTES.smartReports,
    icon: Sparkles,
    color: "teal",
    area: "smart",
  },
  {
    title: "Restoran düzeni",
    description: "Masa yerleşimi",
    href: DASHBOARD_ROUTES.restaurantLayout,
    icon: LayoutGrid,
    color: "orange",
    area: "layout",
  },
  {
    title: "Fatura adresleri",
    description: "Fatura bilgileri",
    href: DASHBOARD_ROUTES.accountBillingAddresses,
    icon: MapPin,
    color: "red",
    area: "billing",
  },
];

export default function DashboardOverviewView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Genel Bakış</h1>
        <p className="text-sm text-muted-foreground">Sık kullanılan işlemlere kısayol.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 [grid-template-areas:'ciro_ciro'_'sessions_sub'_'feedback_feedback'_'security_products'_'orders_orders'_'payment_cards'_'smart_smart'_'layout_billing'] sm:grid-cols-4 sm:[grid-template-areas:'ciro_ciro_sessions_sub'_'feedback_feedback_security_products'_'orders_orders_payment_cards'_'smart_smart_layout_billing']">
        {TILES.map((item) => {
          const Icon = item.icon;
          const stroke = `hsl(var(--chart-${item.color}))`;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[4.5rem] min-w-0 items-start gap-2.5 rounded-xl border p-3 transition-colors hover:brightness-[1.03]"
              style={{
                gridArea: item.area,
                backgroundColor: `hsl(var(--chart-${item.color}) / 0.1)`,
                borderColor: `hsl(var(--chart-${item.color}) / 0.18)`,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `hsl(var(--chart-${item.color}) / 0.18)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: stroke }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-medium leading-tight text-foreground">{item.title}</h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
