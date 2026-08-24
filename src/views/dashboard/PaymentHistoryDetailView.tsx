"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Receipt } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  addonProductLabel,
  formatPackageDate,
  formatPackagePrice,
  purchaseTypeLabel,
} from "@/lib/package-display";
import { getPurchaseSummary } from "@/lib/purchase-fulfillment";
import { purchaseStatusLabel } from "@/lib/refund-display";

type PaymentHistoryDetailViewProps = {
  purchaseId: number;
};

export default function PaymentHistoryDetailView({ purchaseId }: PaymentHistoryDetailViewProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchaseSummary", purchaseId],
    queryFn: () => getPurchaseSummary(purchaseId),
    staleTime: 15_000,
  });

  const installments = data?.installments ?? data?.installmentSchedule ?? [];
  const billing = data?.billingSnapshot;
  const isSubscription = data?.paymentStyle === "SUBSCRIPTION";
  const isAddon = data?.purchaseType === "ADD_ON";
  const title = isAddon
    ? addonProductLabel(data?.packageCode, data?.packageName)
    : (data?.packageName ?? "Ödeme");
  const addonQuantity =
    isAddon && data?.installmentCount && data.installmentCount > 0 ? data.installmentCount : null;
  const products = data?.products ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountPaymentHistory}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ödeme detayı</h1>
          <p className="text-sm text-muted-foreground">Ödeme, kart ve dönem bilgileri</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg border border-border bg-muted" />
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Ödeme detayı yüklenemedi.</p>
      ) : (
        <>
          <Card className="glow-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isAddon ? "Ek ürün" : "Paket"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {purchaseStatusLabel(data.status)}
                    {data.purchasedAt ? ` · ${formatPackageDate(data.purchasedAt)}` : ""}
                    {data.purchaseType ? ` · ${purchaseTypeLabel(data.purchaseType)}` : ""}
                  </p>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {formatPackagePrice(data.price, data.currency)}
                </p>
              </div>
              {isAddon ? (
                <div className="space-y-2 rounded-lg border border-border/70 bg-background p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Ürün</span>
                    <span className="font-medium text-foreground">{title}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Ürün kodu</span>
                    <span className="font-mono text-foreground">{data.packageCode || "—"}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Adet</span>
                    <span className="font-medium text-foreground">{addonQuantity ?? 1}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Geçerlilik</span>
                    <span className="text-foreground">
                      {formatPackageDate(data.startsAt)} – {formatPackageDate(data.expiresAt)}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isAddon && products.length > 0 ? (
            <Card className="glow-card">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-sm font-medium text-foreground">Tanımlanan haklar</h3>
                <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {addonProductLabel(product.productCode, product.productName)}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.productCode}</p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {product.unlimited
                          ? "Sınırsız"
                          : `${product.usedQuantity}/${product.totalQuantity} · ${product.remainingQuantity} kalan`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="glow-card">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Ödeme bilgileri</h3>
              </div>
              <div className="space-y-2 rounded-lg border border-border/70 bg-background p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Ödeme ID</span>
                  <span className="font-mono text-foreground">{data.paymentId || "—"}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Conversation ID</span>
                  <span className="font-mono text-xs text-foreground">
                    {data.paymentConversationId || "—"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Ödenen tutar</span>
                  <span className="font-medium text-foreground">
                    {formatPackagePrice(data.price, data.currency)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Ödeme stili</span>
                  <span className="text-foreground">{data.paymentStyle ?? "—"}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Kart</p>
                  {data.cardLastFour ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(data.cardBrand || "Kart").toString()} · **** {data.cardLastFour}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kart bilgisi kaydı yok (tek seferlik ödeme olabilir).
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isSubscription ? (
            <Card className="glow-card">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-sm font-medium text-foreground">Ödeme dönemleri</h3>
                <p className="text-sm text-foreground">
                  Sonraki ödeme:{" "}
                  <span className="font-medium">{formatPackageDate(data.nextPaymentDueAt)}</span>
                </p>
                {installments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Dönem kaydı yok.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                    {installments.map((item) => (
                      <div
                        key={`${item.installmentNumber}-${item.status}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.installmentNumber}. dönem
                          {item.dueAt ? ` · ${formatPackageDate(item.dueAt)}` : ""}
                        </span>
                        <span className="text-foreground">
                          {formatPackagePrice(item.amount, item.currency ?? data.currency)}
                          {" · "}
                          {item.status === "PAID"
                            ? "Ödendi"
                            : item.status === "PENDING"
                              ? "Bekliyor"
                              : item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {billing ? (
            <Card className="glow-card">
              <CardContent className="space-y-2 p-5 text-sm">
                <h3 className="text-sm font-medium text-foreground">Fatura adresi</h3>
                <p className="text-muted-foreground">
                  {[billing.legalName, billing.name, billing.surname].filter(Boolean).join(" ") || "—"}
                </p>
                <p className="text-muted-foreground">
                  {[billing.address, billing.district, billing.city].filter(Boolean).join(", ") || "—"}
                </p>
                {(billing.email || billing.phone) && (
                  <p className="text-muted-foreground">
                    {[billing.email, billing.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Paket hakları ve iptal işlemleri için{" "}
            <Link
              href={DASHBOARD_ROUTES.accountPurchaseDetail(purchaseId)}
              className="text-primary underline-offset-2 hover:underline"
            >
              paket detayına
            </Link>{" "}
            gidin.
          </p>
        </>
      )}
    </div>
  );
}
