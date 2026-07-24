"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import TrialPackagePicker from "@/components/dashboard/TrialPackagePicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatDaysUntilExpiry,
  formatPackageDate,
  formatPackagePrice,
} from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import {
  invalidateSubscription,
  useSubscription,
} from "@/hooks/use-subscription";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import {
  invalidateDigitalMenuTrial,
  startTrialRequest,
  useEligibleTrialPackages,
  useTrialStatus,
} from "@/hooks/use-commerce";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import {
  canCancelPurchase,
  canResumeRenewal,
  cancelPurchase,
  clearPendingPurchaseId,
  readPendingPurchaseId,
  resumePurchaseRenewal,
} from "@/lib/purchase-fulfillment";
import {
  cancelPlanChange,
  directionLabel,
  listMyPlanChanges,
} from "@/lib/plan-change";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { ApiError } from "@/lib/api/errors";
import type { PlanPackageApiItem } from "@/lib/api";

interface SubscriptionSectionProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

export default function SubscriptionSection({ onNotify }: SubscriptionSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSubscription();
  const trial = useTrialStatus();
  const trialStatus = trial.data?.status ?? "NOT_STARTED";
  const canStartTrial = trialStatus === "NOT_STARTED";
  const eligibleTrials = useEligibleTrialPackages(canStartTrial);
  const planChangesQuery = useQuery({
    queryKey: ["planChanges"],
    queryFn: listMyPlanChanges,
    staleTime: 15_000,
  });
  const [pendingPurchaseId, setPendingPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [startingPackageId, setStartingPackageId] = useState<number | null>(null);
  const handledPurchaseId = useRef<number | null>(null);
  const fulfillment = usePurchaseFulfillment(
    pendingPurchaseId ?? data?.activePurchase?.id ?? null,
    pendingPurchaseId ? pollStartedAt : null,
  );

  useEffect(() => {
    const payment = searchParams.get("payment");
    const queryPurchaseId = Number(searchParams.get("purchaseId"));
    const purchaseId =
      Number.isSafeInteger(queryPurchaseId) && queryPurchaseId > 0
        ? queryPurchaseId
        : readPendingPurchaseId();
    if (purchaseId) {
      const startPolling = window.setTimeout(() => {
        setPendingPurchaseId(purchaseId);
        setPollStartedAt(Date.now());
      }, 0);
      return () => window.clearTimeout(startPolling);
    }
    if (payment === "failed") {
      onNotify("danger", "Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    } else if (payment === "success") {
      onNotify("warning", "Ödeme sonucu doğrulanamadı. Abonelik durumunuzu kontrol edin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [onNotify, router, searchParams]);

  useEffect(() => {
    const summary = fulfillment.summary.data;
    if (
      !summary ||
      pendingPurchaseId !== summary.purchaseId ||
      handledPurchaseId.current === summary.purchaseId
    ) return;
    if (summary.status === "ACTIVE") {
      handledPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      void (async () => {
        await getSiteSameOriginAxios().post("/auth/refresh");
        await Promise.all([
          invalidateSubscription(queryClient),
          invalidatePackageUsage(queryClient),
          invalidateAccessProfile(queryClient),
        ]);
        onNotify("info", "Ödeme tamamlandı ve paketiniz aktif edildi.");
        router.replace(DASHBOARD_ROUTES.accountSubscription);
      })();
      return;
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      handledPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      onNotify("danger", "Ödeme tamamlanamadı. Lütfen tekrar deneyin.");
      router.replace(DASHBOARD_ROUTES.accountSubscription);
    }
  }, [fulfillment.summary.data, onNotify, pendingPurchaseId, queryClient, router]);

  useEffect(() => {
    if (!fulfillment.timedOut || handledPurchaseId.current === pendingPurchaseId) return;
    handledPurchaseId.current = pendingPurchaseId;
    onNotify("warning", "Ödeme durumu henüz kesinleşmedi. Daha sonra tekrar kontrol edin.");
    router.replace(DASHBOARD_ROUTES.accountSubscription);
  }, [fulfillment.timedOut, onNotify, pendingPurchaseId, router]);

  const usedPercent =
    data?.usage && data.usage.total > 0
      ? Math.round((data.usage.used / data.usage.total) * 100)
      : 0;
  const cancellablePurchase = data?.activePurchase;
  const showImmediateCancel = cancellablePurchase ? canCancelPurchase(cancellablePurchase) : false;
  const showResumeRenewal = cancellablePurchase ? canResumeRenewal(cancellablePurchase) : false;
  const isActiveTrial =
    data?.activePurchase?.purchaseType === "TRIAL" &&
    !!data.activePurchase.usable &&
    !data.activePurchase.expired;
  const scheduledChange = useMemo(
    () => planChangesQuery.data?.find((item) => item.status === "SCHEDULED") ?? null,
    [planChangesQuery.data],
  );

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!cancellablePurchase?.id) {
        throw new Error("Aktif paket bulunamadı");
      }
      return cancelPurchase(cancellablePurchase.id);
    },
    onSuccess: async () => {
      await getSiteSameOriginAxios().post("/auth/refresh");
      await Promise.all([
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
      onNotify("info", "Paketiniz iptal edildi.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Paket iptal edilemedi. Lütfen tekrar deneyin.";
      onNotify("danger", message);
    },
  });

  const resumeRenewalMutation = useMutation({
    mutationFn: () => {
      if (!cancellablePurchase?.id) {
        throw new Error("Aktif paket bulunamadı");
      }
      return resumePurchaseRenewal(cancellablePurchase.id);
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
        invalidateAccessProfile(queryClient),
      ]);
      onNotify("info", "Abonelik yenilemesi yeniden açıldı.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Yenilemeyi açma başarısız. Lütfen tekrar deneyin.";
      onNotify("danger", message);
    },
  });

  const cancelPlanChangeMutation = useMutation({
    mutationFn: (id: number) => cancelPlanChange(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["planChanges"] });
      onNotify("info", "Planlanan paket gecisi iptal edildi.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Planlanan gecis iptal edilemedi.";
      onNotify("danger", message);
    },
  });

  const startTrial = async (selectedPackageId: number) => {
    setStartingPackageId(selectedPackageId);
    try {
      const started = await startTrialRequest(selectedPackageId);
      await getSiteSameOriginAxios().post("/auth/refresh");
      await Promise.all([
        invalidateDigitalMenuTrial(queryClient),
        invalidateAccessProfile(queryClient),
        invalidateSubscription(queryClient),
        invalidatePackageUsage(queryClient),
      ]);
      onNotify(
        "info",
        `${started.packageName ?? "Paket"} denemeniz başlatıldı` +
          (started.trialEndsAt ? ` · bitiş: ${formatPackageDate(started.trialEndsAt)}` : "") +
          ".",
      );
    } catch (error) {
      onNotify(
        "danger",
        error instanceof ApiError ? error.message : "Deneme süresi başlatılamadı.",
      );
    } finally {
      setStartingPackageId(null);
    }
  };

  const eligiblePackages = (eligibleTrials.data ?? []) as PlanPackageApiItem[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.account}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Abonelik</h1>
          <p className="text-sm text-muted-foreground">Aktif paketinizi ve kullanım durumunuzu görün.</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="glow-card">
          <CardContent className="p-6">
            <div className="h-24 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ) : isError ? (
        <p className="text-sm text-destructive">Abonelik bilgileri yüklenemedi.</p>
      ) : data ? (
        <>
          <Card className="glow-card border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktif abonelik</p>
                    {isActiveTrial ? (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        Deneme
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{data.usage.packageName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.usage.unlimited
                      ? "Sınırsız QR oluşturma"
                      : `${data.usage.remaining} QR oluşturma hakkı kaldı`}
                  </p>
                  {isActiveTrial ? (
                    <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Deneme süreniz: {formatDaysUntilExpiry(data.activePurchase?.daysUntilExpiry)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-semibold tabular-nums text-foreground">{data.usage.remaining}</p>
                  <p className="text-xs text-muted-foreground">/ {data.usage.total} hak</p>
                </div>
              </div>
              <Progress value={usedPercent} className="h-1.5" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{data.usage.used} kullanıldı</span>
                {data.activePurchase?.expiresAt && (
                  <span>
                    Bitiş: {formatPackageDate(data.activePurchase.expiresAt)} ·{" "}
                    {formatDaysUntilExpiry(data.activePurchase.daysUntilExpiry)}
                  </span>
                )}
                <span>
                  Durum:{" "}
                  {data.activePurchase && data.activePurchase.usable && !data.activePurchase.expired
                    ? "aktif"
                    : "pasif"}
                </span>
              </div>
              {data.activePurchase?.paymentStyle === "SUBSCRIPTION" && data.activePurchase.nextPaymentDueAt ? (
                <p className="text-sm text-foreground">
                  Sonraki ödeme:{" "}
                  <span className="font-medium">{formatPackageDate(data.activePurchase.nextPaymentDueAt)}</span>
                </p>
              ) : data.activePurchase?.nextPaymentDueAt ? (
                <p className="text-xs text-muted-foreground">
                  Sonraki ödeme: {formatPackageDate(data.activePurchase.nextPaymentDueAt)}
                </p>
              ) : null}
              {(data.activePurchase?.paymentApproaching || data.activePurchase?.expiryApproaching) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {data.activePurchase.paymentApproaching
                    ? "Ödeme tarihiniz yaklaşıyor."
                    : "Paket bitiş tarihiniz yaklaşıyor."}
                </p>
              )}
              {cancellablePurchase?.subscriptionStatus === "PAST_DUE" ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme ödemesi başarısız. Dönem sonuna kadar erişiminiz devam eder; kartınızı
                  güncelleyerek yenilemeyi sürdürebilirsiniz.
                </p>
              ) : null}
              {cancellablePurchase?.cancelAtPeriodEnd ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Yenileme kapalı. Erişiminiz {formatPackageDate(cancellablePurchase.expiresAt)}{" "}
                  tarihine kadar devam eder.
                </p>
              ) : null}
              {(showImmediateCancel || showResumeRenewal) && cancellablePurchase ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
                  {showResumeRenewal ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resumeRenewalMutation.isPending}
                      onClick={() => resumeRenewalMutation.mutate()}
                    >
                      {resumeRenewalMutation.isPending ? "Açılıyor..." : "Yenilemeyi tekrar aç"}
                    </Button>
                  ) : null}
                  {showImmediateCancel ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "İptal ediliyor..." : "Paketi iptal et"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Paket iptal edilsin mi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {cancellablePurchase.packageName} paketi hemen iptal edilir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Evet, iptal et
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                  <Link
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(cancellablePurchase.id)}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Satın alma detayı
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {scheduledChange && (
            <Card className="glow-card border-amber-500/30">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Planlanan paket gecisi
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {directionLabel(scheduledChange.direction)}:{" "}
                    {scheduledChange.fromPackageName} → {scheduledChange.toPackageName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPackageDate(scheduledChange.effectiveAt)} tarihinde devreye girecek · tahsil:{" "}
                    {formatPackagePrice(scheduledChange.chargeAmount, scheduledChange.currency)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cancelPlanChangeMutation.isPending}
                  onClick={() => cancelPlanChangeMutation.mutate(scheduledChange.id)}
                >
                  {cancelPlanChangeMutation.isPending ? "Iptal..." : "Planlamayi iptal et"}
                </Button>
              </CardContent>
            </Card>
          )}

          {fulfillment.summary.data && (
            <Card className="glow-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Son ödeme
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {fulfillment.summary.data.packageName}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {fulfillment.summary.data.status}
                  </span>
                </div>
                {fulfillment.summary.data.status === "PENDING" && (
                  <p className="text-xs text-muted-foreground">
                    Ödeme sağlayıcısından kesin sonuç bekleniyor.
                  </p>
                )}
                {(fulfillment.installments.data ??
                  fulfillment.summary.data.installmentSchedule ??
                  []).map((item) => (
                  <div
                    key={item.installmentNumber}
                    className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs text-muted-foreground"
                  >
                    <span>
                      {item.installmentNumber}. taksit
                      {item.dueAt ? ` · ${formatPackageDate(item.dueAt)}` : ""}
                    </span>
                    <span>
                      {formatPackagePrice(item.amount, fulfillment.summary.data?.currency ?? "TRY")} · {item.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {canStartTrial && (
            <div>
              <h2 className="mb-1 text-sm font-medium text-foreground">Deneme paketleri</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Bir paket seçin; süre ve haklar seçtiğiniz pakete göre tanımlanır.
              </p>
              {eligibleTrials.isLoading || trial.isLoading ? (
                <p className="mb-6 text-sm text-muted-foreground">Deneme paketleri yükleniyor…</p>
              ) : (
                <div className="mb-6">
                  <TrialPackagePicker
                    packages={eligiblePackages}
                    startingPackageId={startingPackageId}
                    onStart={(id) => void startTrial(id)}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground">Paket kullanım geçmişi</h2>
            {data.purchases.length === 0 ? (
              <p className="mb-6 text-sm text-muted-foreground">Henüz satın alma kaydı yok.</p>
            ) : (
              <div className="mb-6 space-y-2">
                {data.purchases.map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(purchase.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-3 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{purchase.packageName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPackageDate(purchase.purchasedAt)}
                        {purchase.status ? ` · ${purchase.status}` : ""}
                        {purchase.paymentId ? ` · Ödeme: ${purchase.paymentId}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-foreground">
                      {formatPackagePrice(purchase.price ?? 0, purchase.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </>
      ) : null}
    </div>
  );
}
