"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateBillingAddresses, invalidatePaymentMethods, useBillingAddresses, usePaymentMethods } from "@/hooks/use-commerce";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { useActivePackages } from "@/hooks/use-subscription";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import { ApiError } from "@/lib/api";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import {
  checkoutSchema,
  displayBillingName,
  buildBillingAddressPayload,
  type BillingAddress,
  type BillingAddressForm as BillingAddressFormValues,
  type BillingPeriod,
} from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import {
  clearPendingPurchaseId,
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";

interface PackagePurchaseViewProps {
  packageId: number;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
  returnHref?: string;
}

function money(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

type PaymentOverlay =
  | { kind: "url"; content: string }
  | { kind: "html"; content: string };

export default function PackagePurchaseView({
  packageId,
  onNotify,
  returnHref = DASHBOARD_ROUTES.accountSubscription,
}: PackagePurchaseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const packages = useActivePackages();
  const addresses = useBillingAddresses();
  const methods = usePaymentMethods();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentOverlay | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const finalizedPurchaseId = useRef<number | null>(null);
  const addressInitialized = useRef(false);
  const methodInitialized = useRef(false);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);
  const pkg = packages.data?.find((item) => item.id === packageId);

  useEffect(() => {
    if (!addressInitialized.current && addresses.data?.length) {
      addressInitialized.current = true;
      setBillingAddressId((addresses.data.find((item) => item.defaultAddress) ?? addresses.data[0]).id);
    }
  }, [addresses.data]);

  useEffect(() => {
    if (addresses.isError) {
      onNotify(
        "danger",
        addresses.error instanceof ApiError
          ? addresses.error.message
          : "Fatura adresleri yüklenemedi.",
      );
    }
  }, [addresses.error, addresses.isError, onNotify]);

  useEffect(() => {
    if (!methodInitialized.current && methods.data?.length) {
      methodInitialized.current = true;
      setPaymentMethodId(methods.data[0].id);
    }
  }, [methods.data]);

  const finalizeSuccess = useCallback(async () => {
    await refreshAccessAfterEntitlementChange(queryClient);
    await Promise.all([
      invalidatePackageUsage(queryClient),
      invalidatePaymentMethods(queryClient),
    ]);
    onNotify("info", "Ödeme tamamlandı ve paketiniz aktif edildi.");
    router.push(returnHref);
  }, [onNotify, queryClient, returnHref, router]);

  useEffect(() => {
    const summary = fulfillment.summary.data;
    if (!summary || finalizedPurchaseId.current === summary.purchaseId) return;
    if (summary.status === "ACTIVE") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setPaymentOverlay(null);
      void finalizeSuccess();
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setPaymentOverlay(null);
      onNotify("danger", "Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.");
    }
  }, [finalizeSuccess, fulfillment.summary.data, onNotify]);

  const createAddress = async (values: BillingAddressFormValues) => {
    try {
      const response = await getSiteSameOriginAxios().post<BillingAddress>(
        "/account/billing-addresses",
        buildBillingAddressPayload(values),
      );
      await invalidateBillingAddresses(queryClient);
      if (response.data?.id) setBillingAddressId(response.data.id);
      setCreatingAddress(false);
      onNotify("info", "Fatura adresiniz kaydedildi.");
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Fatura adresi kaydedilemedi.");
    }
  };

  const pricing = useMemo(() => {
    if (!pkg) {
      return { list: 0, effective: 0, discount: 0, suffix: "/ ay" };
    }
    if (billingPeriod === "YEARLY") {
      const list = money(pkg.yearlyPrice);
      const discount = money(pkg.yearlyDiscount);
      const effective = money(pkg.effectiveYearlyPrice ?? list - discount);
      return { list, effective, discount, suffix: "/ yıl" };
    }
    const list = money(pkg.price);
    const discount = money(pkg.monthlyDiscount);
    const effective = money(pkg.effectiveMonthlyPrice ?? list - discount);
    return { list, effective, discount, suffix: "/ ay" };
  }, [billingPeriod, pkg]);

  const pay = async () => {
    const checkout = checkoutSchema.safeParse({
      billingPeriod,
      billingAddressId,
      paymentMethodId,
      recurringConsent,
    });
    if (!checkout.success) {
      onNotify("warning", checkout.error.issues[0]?.message ?? "Ödeme seçimlerini kontrol edin.");
      return;
    }

    const usingNewCard = paymentMethodId == null;

    setIsPaying(true);
    try {
      const selectedAddress = addresses.data?.find((item) => item.id === billingAddressId);
      const payload: Record<string, unknown> = {
        packageId,
        paymentMode: usingNewCard ? "CHECKOUT_FORM" : "THREE_DS",
        paymentStyle: "SUBSCRIPTION",
        billingPeriod,
        billingAddressId,
        paymentMethodId: paymentMethodId != null ? Number(paymentMethodId) : undefined,
        identityNumber: selectedAddress?.tckn || selectedAddress?.vkn || undefined,
        recurringConsent,
      };
      const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>("/purchases", payload);
      if (!Number.isSafeInteger(response.data.purchaseId) || response.data.purchaseId <= 0) {
        throw new Error("Satın alım kimliği alınamadı.");
      }
      storePendingPurchaseId(response.data.purchaseId);
      setPurchaseId(response.data.purchaseId);
      setPollStartedAt(Date.now());
      if (usingNewCard) {
        if (response.data.paymentPageUrl) {
          setPaymentOverlay({ kind: "url", content: response.data.paymentPageUrl });
        } else if (response.data.checkoutFormContent) {
          setPaymentOverlay({
            kind: "html",
            content: `<div id="iyzipay-checkout-form" class="responsive"></div>${response.data.checkoutFormContent}`,
          });
        } else {
          throw new Error("Güvenli ödeme sayfası alınamadı.");
        }
      } else {
        const html = response.data.paymentHtml ?? response.data.htmlContent ?? null;
        if (!html) {
          throw new Error("3D Secure sayfası alınamadı.");
        }
        setPaymentOverlay({ kind: "html", content: html });
      }
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Ödeme işlemi tamamlanamadı.");
    } finally {
      setIsPaying(false);
    }
  };

  if (paymentOverlay) {
    const title = paymentOverlay.kind === "url" ? "Güvenli Ödeme (iyzico)" : "3D Secure doğrulama";
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-medium">{title}</p>
          <Button variant="outline" onClick={() => setPaymentOverlay(null)}>İptal</Button>
        </div>
        {paymentOverlay.kind === "url" ? (
          <iframe
            title={title}
            src={paymentOverlay.content}
            className="w-full flex-1 border-0 bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
          />
        ) : (
          <iframe
            title={title}
            srcDoc={paymentOverlay.content}
            className="w-full flex-1 border-0 bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
          />
        )}
      </div>
    );
  }

  if (packages.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  if (!pkg) return <p className="text-sm text-destructive">Paket bulunamadı veya satışta değil.</p>;

  const priceLabel = formatPackagePrice(pricing.effective, pkg.currency);
  const listLabel = formatPackagePrice(pricing.list, pkg.currency);
  const nextDueLabel = (() => {
    const next = new Date();
    next.setMonth(next.getMonth() + (billingPeriod === "YEARLY" ? 12 : 1));
    return next.toLocaleDateString("tr-TR");
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={returnHref}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Güvenli Ödeme</h1>
          <p className="text-sm text-muted-foreground">Gerçek kart ve fatura bilgilerinizle işlemi tamamlayın.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <Card className="glow-card border-primary/20">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Paket</p>
              <h2 className="mt-1 text-xl font-semibold">{pkg.name}</h2>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                {pricing.discount > 0 ? (
                  <span className="text-lg text-muted-foreground line-through">{listLabel}</span>
                ) : null}
                <p className="text-2xl font-bold">
                  {priceLabel}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{pricing.suffix}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-2 border-t pt-4">
              {packageFeatures(pkg).map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />{feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-medium">Faturalama periyodu</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${billingPeriod === "MONTHLY" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input
                    type="radio"
                    name="billingPeriod"
                    checked={billingPeriod === "MONTHLY"}
                    onChange={() => setBillingPeriod("MONTHLY")}
                  />
                  <span className="text-sm">Aylık</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${billingPeriod === "YEARLY" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input
                    type="radio"
                    name="billingPeriod"
                    checked={billingPeriod === "YEARLY"}
                    onChange={() => setBillingPeriod("YEARLY")}
                  />
                  <span className="text-sm">Yıllık</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Fatura adresi</h2>
                <Button variant="ghost" size="sm" onClick={() => setCreatingAddress((value) => !value)}>Yeni adres</Button>
              </div>
              {creatingAddress ? (
                <BillingAddressForm onSubmit={createAddress} />
              ) : addresses.isLoading ? (
                <div className="h-10 animate-pulse rounded-md bg-muted" />
              ) : addresses.isError ? (
                <p className="text-sm text-destructive">
                  {addresses.error instanceof ApiError
                    ? addresses.error.message
                    : "Fatura adresleri yüklenemedi."}
                </p>
              ) : addresses.data?.length ? (
                <Select
                  value={billingAddressId ? String(billingAddressId) : ""}
                  onValueChange={(value) => setBillingAddressId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fatura adresi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.data.map((address) => (
                      <SelectItem key={address.id} value={String(address.id)}>
                        {displayBillingName(address)} · {address.city}
                        {address.defaultAddress ? " · Aktif" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Button variant="outline" onClick={() => setCreatingAddress(true)}>Fatura adresi oluştur</Button>
              )}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-medium">Kart bilgileri</h2>
              </div>

              {methods.data?.length ? (
                <Select value={paymentMethodId == null ? "new" : paymentMethodId} onValueChange={(value) => setPaymentMethodId(value === "new" ? null : value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {methods.data.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.cardAlias || method.brand || "Kart"} · •••• {method.lastFour}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">Yeni kart kullan</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}

              {paymentMethodId == null && (
                <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Kart bilgileriniz bizim sunucularımıza hiç ulaşmaz. &quot;Ödemeyi Tamamla&quot; butonuna
                    bastığınızda iyzico&apos;nun güvenli ödeme sayfasına yönlendirilirsiniz; kartınız sonraki
                    ödemeler için orada saklanır.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  <p>
                    İlk ödeme: bugün · Sonraki ödeme:{" "}
                    <span className="font-medium text-foreground">{nextDueLabel}</span>
                  </p>
                  <p className="mt-1">
                    {billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"} tutar: {priceLabel}. Sonraki dönemlerde kayıtlı kartınızdan otomatik tahsil edilir.
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Checkbox id="recurring-consent" checked={recurringConsent} onCheckedChange={(checked) => setRecurringConsent(checked === true)} />
                  <Label htmlFor="recurring-consent" className="text-xs font-normal leading-relaxed">
                    Seçtiğim kayıtlı karttan paket dönemlerinde düzenli tahsilat yapılmasını açıkça kabul ediyorum.
                  </Label>
                </div>
              </div>

              <Button className="w-full gap-2" variant="hero" disabled={isPaying || purchaseId != null} onClick={() => void pay()}>
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isPaying ? "Ödeme işleniyor…" : `Ödemeyi Tamamla · ${priceLabel}`}
              </Button>
              {purchaseId && fulfillment.summary.data?.status === "PENDING" && (
                <p className="text-center text-xs text-muted-foreground">Ödeme sonucu doğrulanıyor…</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
