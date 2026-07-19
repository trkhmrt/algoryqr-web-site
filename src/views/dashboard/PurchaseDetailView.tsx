"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Package, Receipt } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatDaysUntilExpiry, formatPackageDate, formatPackagePrice } from "@/lib/package-display";
import { canCancelPurchase, cancelPurchase, getPurchaseSummary } from "@/lib/purchase-fulfillment";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { ApiError } from "@/lib/api/errors";

type PurchaseDetailViewProps = {
  purchaseId: number;
};

export default function PurchaseDetailView({ purchaseId }: PurchaseDetailViewProps) {
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchaseSummary", purchaseId],
    queryFn: () => getPurchaseSummary(purchaseId),
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchase(purchaseId),
    onSuccess: async () => {
      setCancelError(null);
      await getSiteSameOriginAxios().post("/auth/refresh");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchaseSummary", purchaseId] }),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Paket iptal edilemedi. Lutfen tekrar deneyin.";
      setCancelError(message);
    },
  });

  const installments = data?.installments ?? data?.installmentSchedule ?? [];
  const products = data?.products ?? [];
  const billing = data?.billingSnapshot;
  const showCancel = data ? canCancelPurchase(data) : false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountSubscription}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Satin alma detayi</h1>
          <p className="text-sm text-muted-foreground">Paket, odeme ve urun bilgileri.</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Satin alma detayi yuklenemedi.</p>
      ) : (
        <>
          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paket</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{data.packageName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.packageCode}
                    {data.purchaseType ? `  |  ${data.purchaseType}` : ""}
                    {`  |  ${data.status}`}
                  </p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-xl font-semibold text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPackageDate(data.purchasedAt)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Baslangic: {formatPackageDate(data.startsAt)}</p>
                <p>
                  Bitis: {formatPackageDate(data.expiresAt)}  |  {formatDaysUntilExpiry(data.daysUntilExpiry)}
                </p>
                <p>Aktiflik: {data.usable && !data.expired ? "Aktif (tarihe gore)" : "Pasif"}</p>
                <p>Sonraki odeme: {formatPackageDate(data.nextPaymentDueAt)}</p>
                <p>Odeme modu: {data.paymentMode ?? "-"}</p>
                <p>Odeme stili: {data.paymentStyle ?? "-"}</p>
                <p>Taksit: {data.installmentCount ?? 1}</p>
              </div>
              {(data.paymentApproaching || data.expiryApproaching) && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {data.paymentApproaching
                    ? "Odeme tarihiniz 7 gun icinde."
                    : "Paket bitis tarihiniz 7 gun icinde."}
                </p>
              )}
              {showCancel ? (
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Iptal sonrasi paket haklari hemen kapanir; iade otomatik yapilmaz. Abonelik varsa
                    odeme tarafinda da durdurulur.
                  </p>
                  {cancelError ? <p className="text-sm text-destructive">{cancelError}</p> : null}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? "Iptal ediliyor..." : "Paketi iptal et"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Paket iptal edilsin mi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {data.packageName} paketi hemen iptal edilir. Menu erisimi ve paket
                          haklariniz kapanir. Bu islem geri alinamaz; iade icin destek ile iletisime
                          gecmeniz gerekir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Vazgec</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Evet, iptal et
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glow-card" id="odeme">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Odeme bilgileri</h3>
              </div>
              <div className="space-y-2 rounded-lg border border-border/70 bg-background p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Odeme ID</span>
                  <span className="font-mono text-foreground">{data.paymentId || "-"}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Conversation ID</span>
                  <span className="font-mono text-xs text-foreground">
                    {data.paymentConversationId || "-"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Odenen tutar</span>
                  <span className="font-medium text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-4">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Kart</p>
                  {data.cardLastFour ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(data.cardBrand || "Kart").toString()}  |  **** {data.cardLastFour}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kart bilgisi kaydi yok (tek seferlik odeme olabilir).
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-medium text-foreground">Paketteki urunler</h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Urun kaydi bulunamadi.</p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.productCode}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {product.unlimited
                          ? "Sinirsiz"
                          : `${product.usedQuantity}/${product.totalQuantity} kullanildi  |  ${product.remainingQuantity} kalan`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-medium text-foreground">Taksitler</h3>
              {installments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Taksit kaydi yok.</p>
              ) : (
                <div className="space-y-2">
                  {installments.map((item) => (
                    <div
                      key={`${item.installmentNumber}-${item.status}`}
                      className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {item.installmentNumber}. taksit
                        {item.dueAt ? `  |  ${formatPackageDate(item.dueAt)}` : ""}
                      </span>
                      <span className="text-foreground">
                        {formatPackagePrice(item.amount, item.currency ?? data.currency)}  |  {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {billing ? (
            <Card className="glow-card">
              <CardContent className="space-y-2 p-6 text-sm">
                <h3 className="text-sm font-medium text-foreground">Fatura adresi</h3>
                <p className="text-muted-foreground">
                  {[billing.legalName, billing.name, billing.surname].filter(Boolean).join(" ") || "-"}
                </p>
                <p className="text-muted-foreground">
                  {[billing.address, billing.district, billing.city].filter(Boolean).join(", ") || "-"}
                </p>
                {(billing.email || billing.phone) && (
                  <p className="text-muted-foreground">
                    {[billing.email, billing.phone].filter(Boolean).join("  |  ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
