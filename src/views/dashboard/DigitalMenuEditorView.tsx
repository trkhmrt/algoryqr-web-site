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

const HUB_CARDS = [
  {
    key: "products",
    title: "Ürünler",
    description: "Ürün ekleyin, fiyat ve içerikleri güncelleyin.",
    icon: UtensilsCrossed,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuProductsForQr(qrId),
  },
  {
    key: "categories",
    title: "Kategoriler",
    description: "Ana ve alt kategorileri düzenleyin.",
    icon: FolderTree,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuCategoriesForQr(qrId),
  },
  {
    key: "settings",
    title: "Menü Ayarları",
    description: "İşletme bilgileri, tema ve yayın ayarları.",
    icon: Settings2,
    href: (qrId: number) => DASHBOARD_ROUTES.digitalMenuSettings(qrId),
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">Menü</h1>
          <p className="text-sm text-muted-foreground">
            Ürünler, kategoriler ve menü ayarlarını yönetin.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link href={DASHBOARD_ROUTES.digitalMenuAnalytics(qrId)}>
            <TrendingUp className="h-3.5 w-3.5" />
            Analitik
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {HUB_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href(qrId)}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40 sm:p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
