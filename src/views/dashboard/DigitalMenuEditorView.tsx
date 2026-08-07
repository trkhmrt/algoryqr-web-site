"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  Loader2,
  Settings2,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

type DigitalMenuEditorViewProps = {
  qrId: number;
};

const HUB_ITEMS = [
  {
    key: "products",
    title: "Ürünler",
    icon: UtensilsCrossed,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuProductsForQr(qrId),
  },
  {
    key: "categories",
    title: "Kategoriler",
    icon: FolderTree,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuCategoriesForQr(qrId),
  },
  {
    key: "settings",
    title: "Menü Ayarları",
    icon: Settings2,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuSettings(qrId),
  },
  {
    key: "analytics",
    title: "Raporlama",
    icon: TrendingUp,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuAnalytics(qrId),
  },
] as const;

export default function DigitalMenuEditorView({ qrId }: DigitalMenuEditorViewProps) {
  const router = useRouter();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Dijital Menüye Dön
        </Button>
        <p className="text-sm text-muted-foreground">Bu menüyü düzenlemek için PRO paket gerekir.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menü</h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
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
        })}
      </div>
    </div>
  );
}
