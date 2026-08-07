"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, CreditCard, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidatePaymentMethods, usePaymentMethods } from "@/hooks/use-commerce";
import { ApiError } from "@/lib/api";
import {
  formatCardNumber,
  formatExpiry,
  savedCardSchema,
  type SavedCardForm,
} from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

function toExpireParts(expiry: string): { expireMonth: string; expireYear: string } {
  const [month, year] = expiry.split("/");
  return {
    expireMonth: month,
    expireYear: `20${year}`,
  };
}

export default function PaymentMethodsView() {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const methods = usePaymentMethods();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SavedCardForm>({
    resolver: zodResolver(savedCardSchema),
    defaultValues: {
      alias: "",
      cardHolderName: "",
      cardNumber: "",
      expiry: "",
    },
  });

  const removeMethod = async (id: string) => {
    try {
      await getSiteSameOriginAxios().delete(`/account/payment-methods/${id}`);
      await invalidatePaymentMethods(queryClient);
      notify("info", "Kayıtlı kart silindi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Kart silinemedi.");
    }
  };

  const onSubmit = async (values: SavedCardForm) => {
    setSubmitting(true);
    try {
      const { expireMonth, expireYear } = toExpireParts(values.expiry);
      await getSiteSameOriginAxios().post("/account/payment-methods", {
        alias: values.alias?.trim() || "Kartım",
        cardHolderName: values.cardHolderName.trim(),
        cardNumber: values.cardNumber.replace(/\D/g, ""),
        expireMonth,
        expireYear,
      });
      await invalidatePaymentMethods(queryClient);
      form.reset();
      setShowForm(false);
      notify("info", "Kartınız iyzico üzerinde güvenle kaydedildi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Kart kaydedilemedi.");
    } finally {
      setSubmitting(false);
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
          <p className="text-sm text-muted-foreground">Kart bilgileriniz iyzico Kart Saklama ile güvenle tutulur.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          type="button"
          onClick={() => setShowForm((open) => !open)}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Kart ekle"}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Kartınız iyzico Kart Saklama API&apos;si ile tokenlanır; PAN saklanmaz.
          Ücret alınmaz; sonraki ödemelerde kayıtlı kart token&apos;ı kullanılır.
        </p>
      </div>

      {showForm ? (
        <Card>
          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="card-alias">Kart adı (opsiyonel)</Label>
                <Input
                  id="card-alias"
                  placeholder="Örn. İş kartım"
                  {...form.register("alias")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-holder">Kart üzerindeki isim</Label>
                <Input
                  id="card-holder"
                  placeholder="AD SOYAD"
                  autoComplete="cc-name"
                  {...form.register("cardHolderName")}
                />
                {form.formState.errors.cardHolderName ? (
                  <p className="text-xs text-destructive">{form.formState.errors.cardHolderName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-number">Kart numarası</Label>
                <Input
                  id="card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="•••• •••• •••• ••••"
                  value={form.watch("cardNumber")}
                  onChange={(event) => form.setValue("cardNumber", formatCardNumber(event.target.value), { shouldValidate: true })}
                />
                {form.formState.errors.cardNumber ? (
                  <p className="text-xs text-destructive">{form.formState.errors.cardNumber.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Son kullanma (AA/YY)</Label>
                <Input
                  id="card-expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="AA/YY"
                  value={form.watch("expiry")}
                  onChange={(event) => form.setValue("expiry", formatExpiry(event.target.value), { shouldValidate: true })}
                />
                {form.formState.errors.expiry ? (
                  <p className="text-xs text-destructive">{form.formState.errors.expiry.message}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Kartı kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

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
            Henüz kayıtlı kartınız yok. Yukarıdan <strong>Kart ekle</strong> ile iyzico Kart Saklama üzerinden kaydedebilirsiniz.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
