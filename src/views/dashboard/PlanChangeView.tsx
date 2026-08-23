"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";

import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { usePaymentMethods } from "@/hooks/use-commerce";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import { ApiError } from "@/lib/api/errors";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  diffPackages,
  formatPackageDate,
  formatPackagePrice,
  isPackageVisibleInCatalog,
  packageFeatures,
} from "@/lib/package-display";
import { isPaytrCheckout, paytrCheckoutHtml } from "@/lib/paytr-checkout";
import {
  directionLabel,
  previewPlanChange,
  requestPlanChange,
  toAmountNumber,
  type PlanChangePreview,
  type PlanChangeTiming,
} from "@/lib/plan-change";
import {
  abandonPendingPaymentAttempt,
  clearPendingPurchaseId,
  storePendingPurchaseId,
} from "@/lib/purchase-fulfillment";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";

function optionMoneySummary(
  option: PlanChangePreview["options"][number],
  currency: string,
): string {
  const chargeNow = toAmountNumber(option.chargeNow);
  const refundNow = toAmountNumber(option.refundNow);
  const chargeAt = toAmountNumber(option.chargeAtEffective);

  if (option.timing === "NEXT_PERIOD") {
    return `Şimdi ücret yok. ${formatPackageDate(option.effectiveAt)} tarihinde tahsil: ${formatPackagePrice(chargeAt, currency)}`;
  }
  if (chargeNow > 0) {
    return `Şimdi ödeyeceğiniz fark: ${formatPackagePrice(chargeNow, currency)}`;
  }
  if (refundNow > 0) {
    return `Şimdi iade edilecek tutar: ${formatPackagePrice(refundNow, currency)}`;
  }
  return "Şimdi ek ödeme veya iade yok.";
}

interface PlanChangeViewProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

export default function PlanChangeView({ onNotify }: PlanChangeViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toPackageId = Number(searchParams.get("to"));
  const validTarget = Number.isSafeInteger(toPackageId) && toPackageId > 0;
  const queryClient = useQueryClient();
  const methods = usePaymentMethods();
  const subscription = useSubscription();
  const packagesQuery = useActivePackages();
  const [timing, setTiming] = useState<PlanChangeTiming>("IMMEDIATE");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [warningAck, setWarningAck] = useState(false);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentCheckoutOverlayContent | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const finalizedPurchaseId = useRef<number | null>(null);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);

  const previewQuery = useQuery({
    queryKey: ["planChangePreview", toPackageId],
    queryFn: () => previewPlanChange(toPackageId),
    enabled: validTarget,
  });

  useEffect(() => {
    const first = methods.data?.[0];
    if (first && !paymentMethodId) {
      setPaymentMethodId(first.id);
    }
  }, [methods.data, paymentMethodId]);

  const preview = previewQuery.data as PlanChangePreview | undefined;

  useEffect(() => {
    if (!preview?.options.length) return;
    if (!preview.options.some((option) => option.timing === timing)) {
      setTiming(preview.options[0].timing);
    }
  }, [preview, timing]);

  const selectedOption = useMemo(
    () => preview?.options.find((o) => o.timing === timing),
    [preview, timing],
  );
  const chargeNow = toAmountNumber(selectedOption?.chargeNow);
  const refundNow = toAmountNumber(selectedOption?.refundNow);
  const requiresCard = timing === "NEXT_PERIOD";

  const finalizePaidChange = useCallback(async () => {
    await refreshAccessAfterEntitlementChange(queryClient);
    await Promise.all([
      invalidatePackageUsage(queryClient),
      queryClient.invalidateQueries({ queryKey: ["planChanges"] }),
    ]);
    onNotify("info", "Paket geçiş ödemesi tamamlandı. Yeni haklarınız tanımlandı.");
    router.push(DASHBOARD_ROUTES.accountSubscription);
  }, [onNotify, queryClient, router]);

  useEffect(() => {
    const summary = fulfillment.summary.data;
    if (!summary || finalizedPurchaseId.current === summary.purchaseId) return;
    if (summary.status === "ACTIVE") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setPaymentOverlay(null);
      void finalizePaidChange();
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setPaymentOverlay(null);
      setPurchaseId(null);
      setPollStartedAt(null);
      onNotify("danger", "Paket geçiş ödemesi tamamlanamadı. Lütfen tekrar deneyin.");
    }
  }, [finalizePaidChange, fulfillment.summary.data, onNotify]);

  const fromCatalog = packagesQuery.data?.find((pkg) => pkg.id === preview?.fromPackage.id);
  const toCatalog = packagesQuery.data?.find((pkg) => pkg.id === preview?.toPackage.id);
  const targetHidden = !!toCatalog && !isPackageVisibleInCatalog(toCatalog);
  const diff =
    fromCatalog && toCatalog
      ? diffPackages(fromCatalog, toCatalog)
      : toCatalog
        ? diffPackages(null, toCatalog)
        : null;

  const mutation = useMutation({
    mutationFn: () => {
      if (!validTarget) throw new Error("Paket seçilmedi");
      return requestPlanChange({
        toPackageId,
        timing,
        paymentMethodId: paymentMethodId ? Number(paymentMethodId) : undefined,
        warningAck,
      });
    },
    onSuccess: async (result) => {
      if (result.status === "PENDING_PAYMENT") {
        const pendingPurchaseId = result.resultingPurchaseId ?? null;
        if (pendingPurchaseId && Number.isSafeInteger(pendingPurchaseId) && pendingPurchaseId > 0) {
          storePendingPurchaseId(pendingPurchaseId);
          setPurchaseId(pendingPurchaseId);
          setPollStartedAt(Date.now());
        }
        if (result.paymentPageUrl) {
          setPaymentOverlay({ kind: "url", content: result.paymentPageUrl });
          return;
        }
        if (result.checkoutFormContent) {
          setPaymentOverlay({
            kind: "html",
            content: paytrCheckoutHtml(result.checkoutFormContent),
          });
          return;
        }
        onNotify("danger", "Güvenli ödeme sayfası alınamadı.");
        return;
      }
      await refreshAccessAfterEntitlementChange(queryClient);
      await Promise.all([
        invalidatePackageUsage(queryClient),
        queryClient.invalidateQueries({ queryKey: ["planChanges"] }),
      ]);
      const charged = toAmountNumber(result.chargeAmount);
      const refunded = toAmountNumber(result.refundAmount);
      if (result.status === "SCHEDULED") {
        onNotify(
          "info",
          `${result.toPackageName ?? "Yeni paket"} geçişi ${formatPackageDate(result.effectiveAt)} tarihinde planlandı.`,
        );
      } else if (result.status === "COMPLETED") {
        if (charged > 0) {
          onNotify(
            "info",
            `Paket geçişiniz tamamlandı. Fark ödemesi: ${formatPackagePrice(charged, result.currency)}.`,
          );
        } else if (refunded > 0) {
          onNotify(
            "info",
            `Paket geçişiniz tamamlandı. İade tutarı: ${formatPackagePrice(refunded, result.currency)}.`,
          );
        } else {
          onNotify("info", "Paket geçişiniz tamamlandı. Yeni haklarınız tanımlandı.");
        }
      } else {
        onNotify("warning", `Paket geçişi durumu: ${result.status}`);
      }
      router.push(DASHBOARD_ROUTES.accountSubscription);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : "Paket geçişi başarısız. Tekrar deneyin.";
      onNotify("danger", message);
    },
  });

  const canSubmit =
    !!preview &&
    warningAck &&
    !preview.hasScheduledChange &&
    !mutation.isPending &&
    (!requiresCard || !!paymentMethodId);

  const cancelPaymentOverlay = () => {
    setPaymentOverlay(null);
    setPurchaseId(null);
    setPollStartedAt(null);
    finalizedPurchaseId.current = null;
    void abandonPendingPaymentAttempt({ cancelIfPending: true });
  };

  if (paymentOverlay) {
    const title = isPaytrCheckout(paymentOverlay)
      ? "Paket geçişi (PayTR)"
      : "Paket geçişi ödemesi";
    return (
      <PaymentCheckoutOverlay
        overlay={paymentOverlay}
        purchaseId={purchaseId}
        title={title}
        onClose={cancelPaymentOverlay}
      />
    );
  }

  if (!validTarget) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-sm text-destructive">Hedef paket seçilmedi.</p>
        <Button asChild variant="outline">
          <Link href={DASHBOARD_ROUTES.accountPackages}>Paketlere dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountPackages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {preview ? directionLabel(preview.direction) : "Paket değiştir"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {preview
              ? `${preview.fromPackage.name} → ${preview.toPackage.name}`
              : "Geçiş zamanını ve ödemeyi onaylayın."}
          </p>
        </div>
      </div>

      {previewQuery.isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : previewQuery.isError ? (
        <p className="text-sm text-destructive">
          {(previewQuery.error as ApiError)?.message ?? "Önizleme yüklenemedi"}
        </p>
      ) : targetHidden ? (
        <div className="space-y-4">
          <p className="text-sm text-destructive">Bu paket şu an satışta değil.</p>
          <Button asChild variant="outline">
            <Link href={DASHBOARD_ROUTES.accountPackages}>Paketlere dön</Link>
          </Button>
        </div>
      ) : preview ? (
        <>
          {preview.hasScheduledChange && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              Zaten planlanmış bir paket geçişiniz var. Önce onu iptal edin.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="glow-card">
              <CardContent className="space-y-3 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mevcut</p>
                <h2 className="text-lg font-semibold">{preview.fromPackage.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatPackagePrice(preview.fromPackage.price, preview.fromPackage.currency)}
                </p>
                <ul className="space-y-1.5">
                  {(fromCatalog ? packageFeatures(fromCatalog) : preview.fromPackage.features ?? [])
                    .slice(0, 7)
                    .map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {feature}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="glow-card border-primary/30">
              <CardContent className="space-y-3 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Hedef</p>
                <h2 className="text-lg font-semibold">{preview.toPackage.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatPackagePrice(preview.toPackage.price, preview.toPackage.currency)}
                </p>
                {diff?.gained.length ? (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Kazanacaklarınız
                    </p>
                    <ul className="space-y-1.5">
                      {diff.gained.slice(0, 7).map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {(toCatalog ? packageFeatures(toCatalog) : preview.toPackage.features ?? [])
                      .slice(0, 7)
                      .map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glow-card">
            <CardContent className="space-y-4 p-5">
              <div>
                <Label className="text-base">Ne zaman geçilsin?</Label>
                <div className="mt-3 grid gap-2">
                  {preview.options.map((option) => (
                    <button
                      key={option.timing}
                      type="button"
                      onClick={() => setTiming(option.timing)}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        timing === option.timing
                          ? "border-primary bg-primary/5"
                          : "border-border/70 hover:border-primary/40"
                      }`}
                    >
                      <p className="font-medium text-foreground">
                        {option.timing === "IMMEDIATE" ? "Hemen geç" : "Dönem sonunda geç"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {optionMoneySummary(option, preview.toPackage.currency)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-4 text-sm space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Dönem sonu</span>
                  <span>{formatPackageDate(preview.currentExpiresAt)}</span>
                </div>
                {selectedOption && timing === "IMMEDIATE" && chargeNow > 0 && (
                  <div className="flex justify-between gap-2 border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">Şimdi ödeyeceğiniz fark</span>
                    <span className="font-medium">
                      {formatPackagePrice(chargeNow, preview.toPackage.currency)}
                    </span>
                  </div>
                )}
                {selectedOption && timing === "IMMEDIATE" && refundNow > 0 && (
                  <div className="flex justify-between gap-2 border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">Şimdi iade edilecek</span>
                    <span className="font-medium">
                      {formatPackagePrice(refundNow, preview.toPackage.currency)}
                    </span>
                  </div>
                )}
                {subscription.data?.usage ? (
                  <p className="border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    Aktif kullanım: {subscription.data.usage.packageName}
                    {subscription.data.usage.unlimited
                      ? " · sınırsız QR"
                      : ` · ${subscription.data.usage.remaining} QR hakkı`}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Kayıtlı kart{requiresCard ? "" : " (opsiyonel)"}</Label>
                {(methods.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {requiresCard
                      ? "Dönem sonu geçişi için kayıtlı kart gerekir. Kart, önceki bir PayTR ödemesinde kaydedilmiş olmalıdır."
                      : "Hemen geçişte fark ödemesi PayTR güvenli ödeme ekranında alınır; kayıtlı kart zorunlu değildir."}
                  </p>
                ) : (
                  <SearchableSelect
                    value={paymentMethodId}
                    onValueChange={setPaymentMethodId}
                    options={methods.data!.map((method) => ({
                      value: method.id,
                      label: `${(method.brand ?? "Kart").toUpperCase()} ······ ${method.lastFour}`,
                    }))}
                    placeholder="Kart seçin"
                    searchPlaceholder="Kart ara..."
                    emptyText="Kart bulunamadı."
                  />
                )}
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={warningAck}
                  onChange={(e) => setWarningAck(e.target.checked)}
                />
                <span>
                  {preview.warnings[0] ??
                    "Önceki paketten hak devri yoktur; yeni paketin hakları sıfırdan tanımlanır."}
                  {selectedOption?.timing === "IMMEDIATE" && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Hemen geçişte kalan haklarınız silinir.
                    </span>
                  )}
                </span>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link href={DASHBOARD_ROUTES.accountPackages}>Vazgeç</Link>
                </Button>
                <Button
                  type="button"
                  variant="hero"
                  disabled={!canSubmit || (requiresCard && (methods.data?.length ?? 0) === 0)}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending
                    ? "İşleniyor…"
                    : diff?.gained[0]
                      ? `Onayla · ${diff.gained[0]}`
                      : "Onayla"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
