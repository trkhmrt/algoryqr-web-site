"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidatePaymentMethods, usePaymentMethods } from "@/hooks/use-commerce";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

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
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={DASHBOARD_ROUTES.account}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kayıtlı Kartlarım</h1>
          <p className="text-sm text-muted-foreground">
            Kart bilgileriniz PayTR üzerinde tutulur; sunucularımızda PAN saklanmaz.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Yeni kart eklemek için paket satın alırken veya borç öderken PayTR ödeme
          ekranında kart kaydını onaylayın. Kayıtlı kart, sonraki otomatik yenilemelerde
          kullanılır.
        </p>
      </div>

      {methods.isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : methods.isError ? (
        <p className="text-sm text-destructive">Kayıtlı kartlar yüklenemedi.</p>
      ) : methods.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.data.map((method) => (
            <Card key={method.id} className="glow-card">
              <CardContent className="flex items-start justify-between gap-4 p-5">
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Henüz kayıtlı kartınız yok. PayTR ödeme ekranında kart kaydını onayladığınızda
            burada görünür.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
