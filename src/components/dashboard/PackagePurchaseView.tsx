"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { invalidateBillingAddresses, useBillingAddresses } from "@/hooks/use-commerce";
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
  resolveIdentityNumber,
  type BillingAddress,
  type BillingAddressForm as BillingAddressFormValues,
  type BillingPeriod,
} from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatPackagePrice,
  formatYearlySavingsBadge,
  formatYearlySavingsLabel,
  isPackageVisibleInCatalog,
  packageFeatures,
  resolvePackagePricing,
  resolveYearlySavingsPercent,
} from "@/lib/package-display";
import {
  abandonPendingPaymentAttempt,
  clearPendingPurchaseId,
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";
import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import { isPaytrCheckout, paytrCheckoutHtml } from "@/lib/paytr-checkout";
import { cn } from "@/lib/utils";

interface PackagePurchaseViewProps {
  packageId: number;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
  returnHref?: string;
}

type PaymentOverlay = PaymentCheckoutOverlayContent;

export default function PackagePurchaseView({
  packageId,
  onNotify,
  returnHref = DASHBOARD_ROUTES.accountSubscription,
}: PackagePurchaseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const packages = useActivePackages();
  const addresses = useBillingAddresses();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentOverlay | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const finalizedPurchaseId = useRef<number | null>(null);
  const addressInitialized = useRef(false);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);
  const rawPkg = packages.data?.find((item) => item.id === packageId);
  const pkg = rawPkg && isPackageVisibleInCatalog(rawPkg) ? rawPkg : undefined;

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

  const finalizeSuccess = useCallback(async () => {
    await refreshAccessAfterEntitlementChange(queryClient);
    await invalidatePackageUsage(queryClient);
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
      setPurchaseId(null);
      setPollStartedAt(null);
      onNotify("danger", "Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.");
    }
  }, [finalizeSuccess, fulfillment.summary.data, onNotify]);

  const cancelPaymentOverlay = () => {
    setPaymentOverlay(null);
    setPurchaseId(null);
    setPollStartedAt(null);
    finalizedPurchaseId.current = null;
    void abandonPendingPaymentAttempt({ cancelIfPending: true });
  };

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
      return resolvePackagePricing(
        {
          id: 0,
          code: "",
          name: "",
          description: "",
          price: 0,
          currency: "TRY",
          active: true,
          validityDays: 30,
          items: [],
        },
        billingPeriod,
      );
    }
    return resolvePackagePricing(pkg, billingPeriod);
  }, [billingPeriod, pkg]);

  const pay = async () => {
    const checkout = checkoutSchema.safeParse({
      billingPeriod,
      billingAddressId,
      recurringConsent: false,
    });
    if (!checkout.success) {
      onNotify("warning", checkout.error.issues[0]?.message ?? "Ödeme seçimlerini kontrol edin.");
      return;
    }

    const selectedAddress = addresses.data?.find((item) => item.id === billingAddressId);

    setIsPaying(true);
    try {
      const payload: Record<string, unknown> = {
        packageId,
        paymentMode: "CHECKOUT_FORM",
        paymentStyle: "SUBSCRIPTION",
        billingPeriod,
        billingAddressId,
        identityNumber: resolveIdentityNumber(selectedAddress?.tckn, selectedAddress?.vkn),
        recurringConsent: false,
      };
      const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>("/purchases", payload);
      if (!Number.isSafeInteger(response.data.purchaseId) || response.data.purchaseId <= 0) {
        throw new Error("Satın alım kimliği alınamadı.");
      }
      storePendingPurchaseId(response.data.purchaseId);
      setPurchaseId(response.data.purchaseId);
      setPollStartedAt(Date.now());
      if (response.data.paymentPageUrl) {
        setPaymentOverlay({ kind: "url", content: response.data.paymentPageUrl });
      } else if (response.data.checkoutFormContent) {
        setPaymentOverlay({
          kind: "html",
          content: paytrCheckoutHtml(response.data.checkoutFormContent),
        });
      } else {
        throw new Error("Güvenli ödeme sayfası alınamadı.");
      }
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Ödeme işlemi tamamlanamadı.");
    } finally {
      setIsPaying(false);
    }
  };

  if (paymentOverlay) {
    const title = isPaytrCheckout(paymentOverlay)
      ? "Güvenli Ödeme (PayTR)"
      : "Güvenli Ödeme";
    return (
      <PaymentCheckoutOverlay
        overlay={paymentOverlay}
        purchaseId={purchaseId}
        title={title}
        onClose={cancelPaymentOverlay}
      />
    );
  }

  if (packages.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  if (!pkg) return <p className="text-sm text-destructive">Paket bulunamadı veya satışta değil.</p>;

  const priceLabel = formatPackagePrice(pricing.amount, pkg.currency);
  const compareLabel =
    pricing.compareAmount != null ? formatPackagePrice(pricing.compareAmount, pkg.currency) : null;
  const nextDueLabel = (() => {
    const next = new Date();
    next.setMonth(next.getMonth() + (billingPeriod === "YEARLY" ? 12 : 1));
    return next.toLocaleDateString("tr-TR");
  })();

  return (
    <div className="space-y-6 animate-fade-in rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4 sm:p-6 dark:border-border dark:bg-muted/20">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="border-[#e5e7eb] bg-white dark:border-border dark:bg-background">
          <Link href={returnHref}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <BrandLogo size="sm" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Güvenli Ödeme</h1>
          <p className="text-sm text-muted-foreground">Gerçek kart ve fatura bilgilerinizle işlemi tamamlayın.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div className="space-y-5 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-none dark:border-border dark:bg-card">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Paket</p>
            <h2 className="mt-1 text-xl font-semibold">{pkg.name}</h2>
            <div className="mt-1 min-h-[2.75rem]">
              <div className="flex flex-wrap items-baseline gap-2">
                {compareLabel ? (
                  <span className="text-lg text-muted-foreground line-through">{compareLabel}</span>
                ) : null}
                <p className="text-2xl font-bold">
                  {priceLabel}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{pricing.suffix}</span>
                </p>
                {pricing.yearlySavings != null && pricing.yearlySavings > 0 ? (
                  <span
                    className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium leading-none text-emerald-600 dark:text-emerald-400"
                    title={formatYearlySavingsLabel(pricing.yearlySavings, pkg.currency)}
                  >
                    {formatYearlySavingsBadge(
                      pricing.yearlySavings,
                      pkg.currency,
                      resolveYearlySavingsPercent(pricing),
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <ul className="space-y-2 border-t border-[#e5e7eb] pt-4 dark:border-border">
            {packageFeatures(pkg).map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 text-primary" />{feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-none dark:border-border dark:bg-card">
            <h2 className="font-medium">Faturalama periyodu</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border p-3",
                  billingPeriod === "MONTHLY"
                    ? "border-primary bg-primary/5"
                    : "border-[#e5e7eb] bg-[#fafafa] dark:border-border dark:bg-background",
                )}
              >
                <input
                  type="radio"
                  name="billingPeriod"
                  checked={billingPeriod === "MONTHLY"}
                  onChange={() => setBillingPeriod("MONTHLY")}
                />
                <span className="text-sm">Aylık</span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border p-3",
                  billingPeriod === "YEARLY"
                    ? "border-primary bg-primary/5"
                    : "border-[#e5e7eb] bg-[#fafafa] dark:border-border dark:bg-background",
                )}
              >
                <input
                  type="radio"
                  name="billingPeriod"
                  checked={billingPeriod === "YEARLY"}
                  onChange={() => setBillingPeriod("YEARLY")}
                />
                <span className="text-sm">Yıllık</span>
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-none dark:border-border dark:bg-card">
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
              <SearchableSelect
                value={billingAddressId ? String(billingAddressId) : ""}
                onValueChange={(value) => setBillingAddressId(Number(value))}
                options={addresses.data.map((address) => ({
                  value: String(address.id),
                  label: `${displayBillingName(address)} · ${address.city}${address.defaultAddress ? " · Aktif" : ""}`,
                }))}
                placeholder="Fatura adresi seçin"
                searchPlaceholder="Adres ara..."
                emptyText="Adres bulunamadı."
              />
            ) : (
              <Button variant="outline" onClick={() => setCreatingAddress(true)}>Fatura adresi oluştur</Button>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-none dark:border-border dark:bg-card">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Ödeme</h2>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-xs text-muted-foreground dark:border-border dark:bg-background">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Kart bilgileriniz bizim sunucularımıza ulaşmaz. &quot;Ödemeyi Tamamla&quot; butonuna bastığınızda
                PayTR güvenli ödeme sayfası açılır; kart bilgilerinizi yalnızca orada girersiniz. Kart kaydetmek
                isterseniz bunu PayTR ekranından yapabilirsiniz — AlgoryQR tarafında checkout sırasında kart
                saklanmaz.
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-xs text-muted-foreground dark:border-border dark:bg-background">
              <p>
                Bu ödeme: bugün · Dönem bitişi:{" "}
                <span className="font-medium text-foreground">{nextDueLabel}</span>
              </p>
              <p className="mt-1">
                {billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"} tutar: {priceLabel}. Otomatik yenileme
                açık değildir; isterseniz abonelik ayarlarından sonradan aktif edebilirsiniz.
              </p>
              <Link
                href={DASHBOARD_ROUTES.accountSubscription}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                Abonelik ayarlarına git
              </Link>
            </div>

            <Button
              className="w-full gap-2"
              variant="hero"
              disabled={isPaying || (purchaseId != null && fulfillment.summary.data?.status === "PENDING")}
              onClick={() => void pay()}
            >
              {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {isPaying ? "Ödeme işleniyor…" : `Ödemeyi Tamamla · ${priceLabel}`}
            </Button>
            {purchaseId && fulfillment.summary.data?.status === "PENDING" && (
              <p className="text-center text-xs text-muted-foreground">Ödeme sonucu doğrulanıyor…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
