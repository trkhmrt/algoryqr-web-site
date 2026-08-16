"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  Loader2,
  MessageSquareText,
  Settings2,
} from "lucide-react";

import { RequireScope } from "@/components/auth/RequireScope";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";
import { Button } from "@/components/ui/button";
import { useMenuByQr } from "@/hooks/use-menu-by-qr";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type DigitalMenuEditorViewProps = {
  qrId: number;
};

const HUB_ITEMS = [
  {
    key: "products",
    title: "Ürünler",
    icon: DigitalMenuIcon,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuProductsForQr(qrId),
  },
  {
    key: "settings",
    title: "Menü Ayarları",
    icon: Settings2,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuSettings(qrId),
  },
  {
    key: "feedback",
    title: "Geri Bildirimler",
    icon: MessageSquareText,
    href: (qrId: number) => DASHBOARD_ROUTES.feedbackForQr(qrId),
  },
  {
    key: "restaurantLayout",
    title: "Restoran Düzeni",
    icon: LayoutGrid,
    href: (qrId: number) => DASHBOARD_ROUTES.restaurantLayoutForQr(qrId),
    requiredScope: "WAITER_PANEL_OWNER" as const,
  },
] as const;

export default function DigitalMenuEditorView({ qrId }: DigitalMenuEditorViewProps) {
  const router = useRouter();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const menuQuery = useMenuByQr(qrId, canUseDigitalMenu);
  const menuName = menuQuery.data?.businessName?.trim() || "";
  const menuHref = `/menu/${qrId}`;

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {menuName || "Menü"}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {menuName ? "Dijital menü" : "Menü yönetimi"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 gap-1.5">
          <a href={menuHref} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Menüyü aç
          </a>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href(qrId)}
              className="flex w-full items-center justify-between gap-3 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );

          if ("requiredScope" in item && item.requiredScope) {
            return (
              <RequireScope key={item.key} scope={item.requiredScope}>
                {link}
              </RequireScope>
            );
          }

          return <div key={item.key}>{link}</div>;
        })}
      </div>
    </div>
  );
}
