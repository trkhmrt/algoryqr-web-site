"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Loader2, Lock } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  invalidateBillingAddresses,
  invalidatePaymentMethods,
  useBillingAddresses,
  useInstallmentOptions,
  usePaymentMethods,
} from "@/hooks/use-commerce";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import { ApiError } from "@/lib/api";
import {
  cardSchema,
  checkoutSchema,
  formatCardNumber,
  formatExpiry,
  getBin,
  displayBillingName,
  type BillingAddress,
  type BillingAddressForm as BillingAddressFormValues,
  type CardForm,
  type PaymentStyle,
} from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import {
  clearPendingPurchaseId,
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

interface PackagePurchaseViewProps {
  packageId: number;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
  returnHref?: string;
}

export default function PackagePurchaseView({
  packageId,
  onNotify,
  returnHref = DASHBOARD_ROUTES.accountSubscription,
}: PackagePurchaseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscription = useSubscription();
  const addresses = useBillingAddresses();
  const methods = usePaymentMethods();
  const [paymentStyle, setPaymentStyle] = useState<PaymentStyle>("ONE_TIME");
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [threeDsHtml, setThreeDsHtml] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const finalizedPurchaseId = useRef<number | null>(null);
  const addressInitialized = useRef(false);
  const methodInitialized = useRef(false);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);
  const pkg = subscription.data?.packages.find((item) => item.id === packageId);
  const cardForm = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { cardHolderName: "", cardNumber: "", expiry: "", cvc: "", saveCard: false },
  });
  const cardNumber = cardForm.watch("cardNumber");
  const bin = getBin(cardNumber);
  const installments = useInstallmentOptions(
    bin,
    pkg?.price ?? null,
    paymentStyle === "BANK_INSTALLMENT",
  );

  useEffect(() => {
    if (!addressInitialized.current && addresses.data?.length) {
      addressInitialized.current = true;
      setBillingAddressId((addresses.data.find((item) => item.defaultAddress) ?? addresses.data[0]).id);
    }
  }, [addresses.data]);

  useEffect(() => {
    if (!methodInitialized.current && methods.data?.length && paymentStyle !== "BANK_INSTALLMENT") {
      methodInitialized.current = true;
      setPaymentMethodId((methods.data[0]).id);
    }
  }, [methods.data, paymentStyle]);

  useEffect(() => {
    if (paymentStyle === "BANK_INSTALLMENT") setPaymentMethodId(null);
  }, [paymentStyle]);

  const finalizeSuccess = useCallback(async () => {
    await getSiteSameOriginAxios().post("/auth/refresh");
    await Promise.all([
      invalidateSubscription(queryClient),
      invalidatePackageUsage(queryClient),
      invalidateAccessProfile(queryClient),
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
      setThreeDsHtml(null);
      void finalizeSuccess();
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setThreeDsHtml(null);
      onNotify("danger", "Ödeme tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.");
    }
  }, [finalizeSuccess, fulfillment.summary.data, onNotify]);

  const createAddress = async (values: BillingAddressFormValues) => {
    try {
      const response = await getSiteSameOriginAxios().post<BillingAddress>("/account/billing-addresses", values);
      await invalidateBillingAddresses(queryClient);
      if (response.data?.id) setBillingAddressId(response.data.id);
      setCreatingAddress(false);
      onNotify("info", "Fatura adresiniz kaydedildi.");
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Fatura adresi kaydedilemedi.");
    }
  };

  const pay = async () => {
    const checkout = checkoutSchema.safeParse({
      paymentStyle,
      billingAddressId,
      paymentMethodId,
      bankInstallmentCount: installmentCount,
      recurringConsent,
    });
    if (!checkout.success) {
      onNotify("warning", checkout.error.issues[0]?.message ?? "Ödeme seçimlerini kontrol edin.");
      return;
    }

    let card: CardForm | null = null;
    if (paymentMethodId == null) {
      const valid = await cardForm.trigger();
      if (!valid) {
        onNotify("warning", "Kart bilgilerini kontrol edin.");
        return;
      }
      card = cardForm.getValues();
    }

    setIsPaying(true);
    try {
      const selectedAddress = addresses.data?.find((item) => item.id === billingAddressId);
      const payload: Record<string, unknown> = {
        packageId,
        paymentMode: "THREE_DS",
        paymentStyle,
        billingAddressId,
        paymentMethodId: paymentMethodId != null ? Number(paymentMethodId) : undefined,
        bankInstallmentCount: paymentStyle === "BANK_INSTALLMENT" ? installmentCount : undefined,
        installmentCount: paymentStyle === "BANK_INSTALLMENT" ? installmentCount : 1,
        identityNumber: selectedAddress?.tckn || selectedAddress?.vkn || undefined,
        recurringConsent: paymentStyle === "SUBSCRIPTION" ? recurringConsent : undefined,
      };
      if (card) {
        const [expireMonth, expireYear] = card.expiry.split("/");
        payload.paymentCard = {
          cardHolderName: card.cardHolderName.trim(),
          cardNumber: card.cardNumber.replace(/\D/g, ""),
          expireMonth,
          expireYear: `20${expireYear}`,
          cvc: card.cvc,
          registerCard: card.saveCard || paymentStyle === "SUBSCRIPTION" ? 1 : 0,
        };
      }
      const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>("/purchases", payload);
      if (!Number.isSafeInteger(response.data.purchaseId) || response.data.purchaseId <= 0) {
        throw new Error("Satın alım kimliği alınamadı.");
      }
      storePendingPurchaseId(response.data.purchaseId);
      setPurchaseId(response.data.purchaseId);
      setPollStartedAt(Date.now());
      setThreeDsHtml(response.data.paymentHtml ?? response.data.htmlContent ?? null);
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Ödeme işlemi tamamlanamadı.");
    } finally {
      setIsPaying(false);
    }
  };

  if (threeDsHtml) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-medium">3D Secure doğrulama</p>
          <Button variant="outline" onClick={() => setThreeDsHtml(null)}>İptal</Button>
        </div>
        <iframe title="3D Secure" srcDoc={threeDsHtml} className="w-full flex-1 border-0 bg-white" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation" />
      </div>
    );
  }

  if (subscription.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  if (!pkg) return <p className="text-sm text-destructive">Paket bulunamadı veya satışta değil.</p>;

  const priceLabel = formatPackagePrice(pkg.price, pkg.currency);
  const options = installments.data ?? [];

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
              <p className="mt-1 text-2xl font-bold">{priceLabel}</p>
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
              <h2 className="font-medium">Ödeme stili</h2>
              <Select value={paymentStyle} onValueChange={(value) => setPaymentStyle(value as PaymentStyle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">Tek çekim</SelectItem>
                  <SelectItem value="BANK_INSTALLMENT">Banka taksiti</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Abonelik</SelectItem>
                </SelectContent>
              </Select>
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
              ) : addresses.data?.length ? (
                <Select value={billingAddressId ? String(billingAddressId) : ""} onValueChange={(value) => setBillingAddressId(Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Fatura adresi seçin" /></SelectTrigger>
                  <SelectContent>
                    {addresses.data.map((address) => (
                      <SelectItem key={address.id} value={String(address.id)}>
                        {displayBillingName(address)} · {address.city}
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

              {methods.data?.length && paymentStyle !== "BANK_INSTALLMENT" ? (
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kart üzerindeki isim</Label>
                    <Input autoComplete="cc-name" {...cardForm.register("cardHolderName")} />
                    <p className="text-xs text-destructive">{cardForm.formState.errors.cardHolderName?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Kart numarası</Label>
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-number"
                      {...cardForm.register("cardNumber", { onChange: (event) => cardForm.setValue("cardNumber", formatCardNumber(event.target.value)) })}
                    />
                    <p className="text-xs text-destructive">{cardForm.formState.errors.cardNumber?.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Son kullanma</Label>
                      <Input
                        placeholder="AA/YY"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        {...cardForm.register("expiry", { onChange: (event) => cardForm.setValue("expiry", formatExpiry(event.target.value)) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input inputMode="numeric" autoComplete="cc-csc" maxLength={4} {...cardForm.register("cvc")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-card"
                      checked={cardForm.watch("saveCard") || paymentStyle === "SUBSCRIPTION"}
                      disabled={paymentStyle === "SUBSCRIPTION"}
                      onCheckedChange={(checked) => cardForm.setValue("saveCard", checked === true)}
                    />
                    <Label htmlFor="save-card" className="text-sm font-normal">Kartımı sonraki ödemeler için güvenle kaydet</Label>
                  </div>
                </div>
              )}

              {paymentStyle === "BANK_INSTALLMENT" && (
                <div className="space-y-2">
                  <Label>Taksit seçimi</Label>
                  <Select value={String(installmentCount)} onValueChange={(value) => setInstallmentCount(Number(value))} disabled={options.length === 0}>
                    <SelectTrigger><SelectValue placeholder={installments.isFetching ? "BIN seçenekleri yükleniyor" : "Taksit seçin"} /></SelectTrigger>
                    <SelectContent>
                      {options.filter((option) => option.installmentCount > 1).map((option) => (
                        <SelectItem key={option.installmentCount} value={String(option.installmentCount)}>
                          {option.installmentCount} taksit
                          {option.monthlyAmount != null ? ` · ${formatPackagePrice(option.monthlyAmount, pkg.currency)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Seçenekler kartınızın BIN bilgisine göre bankadan yüklenir.</p>
                </div>
              )}

              {paymentStyle === "SUBSCRIPTION" && (
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Checkbox id="recurring-consent" checked={recurringConsent} onCheckedChange={(checked) => setRecurringConsent(checked === true)} />
                  <Label htmlFor="recurring-consent" className="text-xs font-normal leading-relaxed">
                    Seçtiğim kayıtlı karttan paket dönemlerinde düzenli tahsilat yapılmasını açıkça kabul ediyorum.
                  </Label>
                </div>
              )}

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
