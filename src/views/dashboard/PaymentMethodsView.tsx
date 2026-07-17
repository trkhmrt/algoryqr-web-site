"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";

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

export default function PaymentMethodsView() {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const methods = usePaymentMethods();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const submitCard = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      const [expireMonth, expireYearShort] = values.expiry.split("/");
      await getSiteSameOriginAxios().post("/account/payment-methods", {
        alias: values.alias?.trim() || "Kartım",
        cardHolderName: values.cardHolderName.trim(),
        cardNumber: values.cardNumber,
        expireMonth,
        expireYear: `20${expireYearShort}`,
      });
      await invalidatePaymentMethods(queryClient);
      form.reset();
      setShowForm(false);
      notify("info", "Kartınız güvenle kaydedildi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Kart kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  });

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
          <p className="text-sm text-muted-foreground">Kart bilgileriniz iyzico üzerinden güvenle saklanır.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Formu kapat" : "Kart ekle"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-sm font-medium">Yeni kart ekle</h2>
              <p className="text-xs text-muted-foreground">Kart numarası sunucuda saklanmaz; iyzico token’ı kaydedilir.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Kart takma adı</Label>
                <Input placeholder="Örn. İş kartım" {...form.register("alias")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Kart üzerindeki isim</Label>
                <Input autoComplete="cc-name" {...form.register("cardHolderName")} />
                <p className="text-xs text-destructive">{form.formState.errors.cardHolderName?.message}</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Kart numarası</Label>
                <Input
                  autoComplete="cc-number"
                  inputMode="numeric"
                  value={formatCardNumber(form.watch("cardNumber") || "")}
                  onChange={(event) => form.setValue("cardNumber", event.target.value.replace(/\D/g, ""), { shouldValidate: true })}
                />
                <p className="text-xs text-destructive">{form.formState.errors.cardNumber?.message}</p>
              </div>
              <div className="space-y-2">
                <Label>Son kullanma (AA/YY)</Label>
                <Input
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  placeholder="12/28"
                  value={form.watch("expiry")}
                  onChange={(event) => form.setValue("expiry", formatExpiry(event.target.value), { shouldValidate: true })}
                />
                <p className="text-xs text-destructive">{form.formState.errors.expiry?.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { form.reset(); setShowForm(false); }}>
                Vazgeç
              </Button>
              <Button type="button" disabled={saving} onClick={() => void submitCard()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kartı kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            Henüz kayıtlı kartınız yok. Yukarıdan <strong>Kart ekle</strong> ile iyzico üzerinden güvenle kaydedebilirsiniz.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
