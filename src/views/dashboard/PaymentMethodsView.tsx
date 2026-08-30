"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Trash2 } from "lucide-react";

import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { CardVerificationPanel } from "@/components/dashboard/CardVerificationPanel";
import { invalidatePaymentMethods, usePaymentMethods } from "@/hooks/use-commerce";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";

export default function PaymentMethodsView() {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const methods = usePaymentMethods();

  const removeMethod = async (id: string) => {
    try {
      await getSiteSameOriginAxios().delete(`/account/payment-methods/${id}`);
      await invalidatePaymentMethods(queryClient);
      notify("info", "Kayıtlı kart silindi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Kart silinemedi.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Kayıtlı Kartlarım"
        hint="Kart bilgileriniz PayTR üzerinde tutulur; sunucularımızda PAN saklanmaz."
        back={
          <Link href={DASHBOARD_ROUTES.account} aria-label="Hesaba dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <CardVerificationPanel />

      {methods.isLoading ? (
        <DashboardLoadingState label="Kayıtlı kartlar yükleniyor…" />
      ) : methods.isError ? (
        <p className="text-sm text-destructive">Kayıtlı kartlar yüklenemedi.</p>
      ) : methods.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.data.map((method) => (
            <div key={method.id} className={`${DASHBOARD_PANEL} flex items-start justify-between gap-4`}>
              <div className="flex gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-medium">{method.cardAlias || method.brand || "Kayıtlı kart"}</h2>
                  <p className="mt-2 font-mono text-sm text-muted-foreground">•••• •••• •••• {method.lastFour}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.brand}
                    {method.expiryMonth && method.expiryYear ? ` · ${method.expiryMonth}/${method.expiryYear}` : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => void removeMethod(method.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${DASHBOARD_PANEL} border-dashed text-center text-sm text-muted-foreground`}>
          Henüz kayıtlı kartınız yok. Yukarıdaki PayTR adımıyla kart ekleyin.
        </div>
      )}
    </div>
  );
}
