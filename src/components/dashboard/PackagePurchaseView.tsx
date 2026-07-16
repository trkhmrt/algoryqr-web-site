"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Check, CreditCard, Loader2, Lock, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import {
  clearPendingPurchaseId,
  getInstallmentOptions,
  getPaymentModes,
  storePendingPurchaseId,
  type PaymentMode,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";

interface PackagePurchaseViewProps {
  packageId: number;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

interface CardFormState {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

const EMPTY_CARD_FORM: CardFormState = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

const DEV_CARD_FORM: CardFormState = {
  cardholderName: "Tarık Hamarat",
  cardNumber: "5890 0400 0000 0016",
  expiry: "12/30",
  cvv: "123",
};

const INITIAL_FORM: CardFormState =
  process.env.NODE_ENV === "development" ? DEV_CARD_FORM : EMPTY_CARD_FORM;

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isFormValid(form: CardFormState): boolean {
  const digits = form.cardNumber.replace(/\s/g, "");
  const [mm, yy] = form.expiry.split("/");
  return (
    form.cardholderName.trim().length >= 2 &&
    digits.length >= 15 &&
    mm?.length === 2 &&
    yy?.length === 2 &&
    form.cvv.length >= 3
  );
}

export default function PackagePurchaseView({ packageId, onNotify }: PackagePurchaseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSubscription();
  const [form, setForm] = useState<CardFormState>(INITIAL_FORM);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("THREE_DS");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
  const [threeDsHtml, setThreeDsHtml] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const finalizedPurchaseId = useRef<number | null>(null);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);

  const pkg = data?.packages.find((item) => item.id === packageId);
  const isActive =
    data?.activePurchase?.packageId === packageId &&
    data.activePurchase.usable &&
    !data.activePurchase.expired;

  useEffect(() => {
    if (!pkg) return;
    const modes = getPaymentModes(pkg);
    const options = getInstallmentOptions(pkg);
    setPaymentMode((current) => (modes.includes(current) ? current : modes[0]));
    setInstallmentCount((current) =>
      options.some((option) => option.installmentCount === current)
        ? current
        : options[0].installmentCount,
    );
  }, [pkg]);

  const updateField = <K extends keyof CardFormState>(key: K, value: CardFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const finalizeSuccess = useCallback(async (message: string) => {
    await getSiteSameOriginAxios().post("/auth/refresh");
    await Promise.all([
      invalidateSubscription(queryClient),
      invalidatePackageUsage(queryClient),
      invalidateAccessProfile(queryClient),
    ]);
    onNotify("info", message);
    router.push(DASHBOARD_ROUTES.accountSubscription);
  }, [onNotify, queryClient, router]);

  const handlePay = async () => {
    if (!pkg || !isFormValid(form)) {
      onNotify("warning", "Lütfen tüm kart bilgilerini eksiksiz girin.");
      return;
    }

    setIsPaying(true);
    try {
      const [expireMonth, expireYearPart] = form.expiry.split("/");
      const expireYear = expireYearPart?.length === 2 ? `20${expireYearPart}` : expireYearPart;
      const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>("/purchases", {
        packageId: pkg.id,
        paymentMode,
        installmentCount,
        identityNumber: "11111111111",
        paymentCard: {
          cardHolderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber.replace(/\s/g, ""),
          expireMonth,
          expireYear,
          cvc: form.cvv,
          registerCard: 0,
        },
        billingAddress: {
          contactName: form.cardholderName.trim(),
          city: "Istanbul",
          country: "Turkey",
          address: "Türkiye",
          zipCode: "34000",
        },
      });

      const result = response.data;
      if (!Number.isSafeInteger(result.purchaseId) || result.purchaseId <= 0) {
        throw new Error("Satın alım kimliği alınamadı.");
      }
      storePendingPurchaseId(result.purchaseId);
      setPurchaseId(result.purchaseId);
      setPollStartedAt(Date.now());
      const paymentHtml = result.paymentHtml ?? result.htmlContent;
      if (paymentHtml) setThreeDsHtml(paymentHtml);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Ödeme işlemi tamamlanamadı.";
      onNotify("danger", msg);
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const summary = fulfillment.summary.data;
    if (!summary || finalizedPurchaseId.current === summary.purchaseId) return;
    if (summary.status === "ACTIVE") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setThreeDsHtml(null);
      void finalizeSuccess("Ödeme tamamlandı ve paketiniz aktif edildi.");
      return;
    }
    if (summary.status === "FAILED" || summary.status === "CANCELLED") {
      finalizedPurchaseId.current = summary.purchaseId;
      clearPendingPurchaseId();
      setThreeDsHtml(null);
      onNotify("danger", "Ödeme tamamlanamadı. Kartınızdan tahsilat yapılmadıysa tekrar deneyebilirsiniz.");
    }
  }, [finalizeSuccess, fulfillment.summary.data, onNotify]);

  useEffect(() => {
    if (fulfillment.timedOut) setThreeDsHtml(null);
  }, [fulfillment.timedOut]);

  useEffect(() => {
    if (!threeDsHtml) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [threeDsHtml]);

  if (threeDsHtml) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">3D Secure doğrulama</p>
          <Button variant="outline" size="sm" onClick={() => setThreeDsHtml(null)}>
            İptal
          </Button>
        </div>
        <iframe
          title="3D Secure"
          srcDoc={threeDsHtml}
          className="flex-1 w-full border-0 bg-white"
          sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="glow-card">
        <CardContent className="p-6">
          <div className="h-64 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Paket bilgileri yüklenemedi.</p>
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.accountSubscription}>Aboneliğe dön</Link>
        </Button>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-sm text-destructive">Paket bulunamadı veya artık satışta değil.</p>
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.accountSubscription}>Aboneliğe dön</Link>
        </Button>
      </div>
    );
  }

  const features = packageFeatures(pkg);
  const priceLabel = formatPackagePrice(pkg.price, pkg.currency);
  const formReady = isFormValid(form);
  const isFree = parseFloat(String(pkg.price)) <= 0;
  const paymentModes = getPaymentModes(pkg);
  const installmentOptions = getInstallmentOptions(pkg);
  const selectedInstallment =
    installmentOptions.find((option) => option.installmentCount === installmentCount) ?? installmentOptions[0];
  const schedule =
    fulfillment.installments.data ??
    fulfillment.summary.data?.installmentSchedule ??
    [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={DASHBOARD_ROUTES.accountSubscription}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ödeme</h1>
          <p className="text-sm text-muted-foreground">Kart bilgilerinizi girerek satın almayı tamamlayın.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start max-w-5xl">
        <Card className="glow-card border-primary/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paket</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{pkg.name}</h2>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {priceLabel}
                  {pkg.validityDays > 0 && parseFloat(String(pkg.price)) > 0 && (
                    <span className="text-sm font-normal text-muted-foreground"> / {pkg.validityDays} gün</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Paket içeriği</p>
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="font-medium text-foreground">Ödenecek tutar</span>
              <span className="text-xl font-semibold text-foreground">{priceLabel}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Kart bilgileri</h3>
            </div>

            {isFree ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                Bu paket ödeme ekranından satın alınamaz.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Kart üzerindeki isim</Label>
                  <Input
                    id="cardholderName"
                    placeholder="Ad Soyad"
                    autoComplete="cc-name"
                    value={form.cardholderName}
                    onChange={(e) => updateField("cardholderName", e.target.value)}
                    disabled={isPaying || isActive}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Kart numarası</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={form.cardNumber}
                    onChange={(e) => updateField("cardNumber", formatCardNumber(e.target.value))}
                    disabled={isPaying || isActive}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Son kullanma</Label>
                    <Input
                      id="expiry"
                      placeholder="AA/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={form.expiry}
                      onChange={(e) => updateField("expiry", formatExpiry(e.target.value))}
                      disabled={isPaying || isActive}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      value={form.cvv}
                      onChange={(e) => updateField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      disabled={isPaying || isActive}
                    />
                  </div>
                </div>

                {paymentModes.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Ödeme yöntemi</Label>
                    <Select
                      value={paymentMode}
                      onValueChange={(value) => setPaymentMode(value as PaymentMode)}
                      disabled={isPaying || isActive}
                    >
                      <SelectTrigger id="paymentMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem
                            key={mode}
                            value={mode}
                            disabled={installmentCount > 1 && mode === "THREE_DS"}
                          >
                            {mode === "THREE_DS" ? "3D Secure" : "Doğrudan ödeme"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {installmentOptions.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="installmentCount">Taksit</Label>
                    <Select
                      value={String(installmentCount)}
                      onValueChange={(value) => {
                        const count = Number(value);
                        setInstallmentCount(count);
                        if (count > 1) setPaymentMode("DIRECT");
                      }}
                      disabled={isPaying || isActive}
                    >
                      <SelectTrigger id="installmentCount">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map((option) => (
                          <SelectItem key={option.installmentCount} value={String(option.installmentCount)}>
                            {option.installmentCount === 1
                              ? "Tek çekim"
                              : `${option.installmentCount} taksit`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedInstallment && selectedInstallment.installmentCount > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedInstallment.monthlyAmount != null
                          ? `Aylık ${formatPackagePrice(selectedInstallment.monthlyAmount, pkg.currency)}`
                          : `${selectedInstallment.installmentCount} eşit ödeme`}
                        {selectedInstallment.totalAmount != null
                          ? ` · Toplam ${formatPackagePrice(selectedInstallment.totalAmount, pkg.currency)}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {paymentMode === "THREE_DS" ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              )}
              <p>
                {paymentMode === "THREE_DS"
                  ? "Ödeme 3D Secure ile doğrulanır. Paket yalnızca ödeme durumu aktif olduğunda tanımlanır."
                  : "Paket yalnızca ödeme durumu aktif olduğunda tanımlanır."}
              </p>
            </div>

            {purchaseId && fulfillment.summary.data && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">Ödeme durumu</span>
                  <span className="text-muted-foreground">{fulfillment.summary.data.status}</span>
                </div>
                {fulfillment.summary.data.status === "PENDING" && !fulfillment.timedOut && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ödemenin kesinleşmesi bekleniyor.
                  </div>
                )}
                {fulfillment.timedOut && (
                  <p className="text-xs text-amber-600">
                    İşlem beklenenden uzun sürdü. Durumu abonelik ekranından yeniden kontrol edebilirsiniz.
                  </p>
                )}
                {schedule.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    {schedule.map((item) => (
                      <div
                        key={item.installmentNumber}
                        className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
                      >
                        <span>
                          {item.installmentNumber}. taksit
                          {item.dueAt ? ` · ${new Date(item.dueAt).toLocaleDateString("tr-TR")}` : ""}
                        </span>
                        <span>
                          {formatPackagePrice(item.amount, pkg.currency)} · {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant="hero"
              className="w-full gap-2"
              disabled={isFree || isActive || isPaying || !formReady || purchaseId != null}
              onClick={() => void handlePay()}
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ödeme işleniyor…
                </>
              ) : isActive ? (
                "Paket zaten aktif"
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {paymentMode === "THREE_DS" ? "3DS ile Öde" : "Ödeme Yap"} · {priceLabel}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
