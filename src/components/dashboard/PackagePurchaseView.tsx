"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import { invalidatePackageUsage } from "@/hooks/use-package-usage";
import { invalidateSubscription, useSubscription } from "@/hooks/use-subscription";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

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

type PackageCheckoutResponse = {
  success?: boolean;
  mode?: "free" | "direct" | "three-ds";
  conversationId?: string;
  htmlContent?: string;
  message?: string;
};

const INITIAL_FORM: CardFormState = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

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
  const [use3ds, setUse3ds] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [threeDsHtml, setThreeDsHtml] = useState<string | null>(null);

  const pkg = data?.packages.find((item) => item.id === packageId);
  const isActive =
    data?.activePurchase?.packageId === packageId &&
    data.activePurchase.usable &&
    !data.activePurchase.expired;

  const updateField = <K extends keyof CardFormState>(key: K, value: CardFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const finalizeSuccess = async (message: string) => {
    await Promise.all([
      invalidateSubscription(queryClient),
      invalidatePackageUsage(queryClient),
    ]);
    onNotify("info", message);
    router.push(DASHBOARD_ROUTES.accountSubscription);
  };

  const handlePay = async () => {
    if (!pkg || !isFormValid(form)) {
      onNotify("warning", "Lütfen tüm kart bilgilerini eksiksiz girin.");
      return;
    }

    setIsPaying(true);
    try {
      const response = await getSiteSameOriginAxios().post<PackageCheckoutResponse>("/payments/package", {
        packageId: pkg.id,
        use3ds,
        card: {
          cardholderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber,
          expiry: form.expiry,
          cvv: form.cvv,
        },
      });

      const result = response.data;
      if (result.mode === "three-ds" && result.htmlContent) {
        setThreeDsHtml(result.htmlContent);
        return;
      }

      await finalizeSuccess(`Ödeme başarılı! "${pkg.name}" paketi hesabınıza tanımlandı.`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Ödeme işlemi tamamlanamadı.";
      onNotify("danger", msg);
    } finally {
      setIsPaying(false);
    }
  };

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

            {!isFree && (
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

                <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Checkbox
                    id="use3ds"
                    checked={use3ds}
                    onCheckedChange={(checked) => setUse3ds(checked === true)}
                    disabled={isPaying || isActive}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground">3DS ile ödeme yapmak istiyorum</span>
                    <p className="text-xs text-muted-foreground">
                      Bankanızın ek doğrulama adımı ile güvenli ödeme yapılır.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {use3ds ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              )}
              <p>
                {use3ds
                  ? "Ödeme 3D Secure ile başlatılır; doğrulama sonrası paket hesabınıza tanımlanır."
                  : "Ödeme doğrudan alınır; başarılı işlem sonrası paket hesabınıza tanımlanır."}
              </p>
            </div>

            <Button
              variant="hero"
              className="w-full gap-2"
              disabled={isActive || isPaying || (!isFree && !formReady)}
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
                  {use3ds ? "3DS ile Öde" : "Ödeme Yap"} · {priceLabel}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
