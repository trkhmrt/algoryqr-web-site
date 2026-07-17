"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateBillingAddresses, useBillingAddresses } from "@/hooks/use-commerce";
import { ApiError } from "@/lib/api";
import { displayBillingName, type BillingAddressForm as BillingAddressFormValues } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export default function BillingAddressesView() {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const addresses = useBillingAddresses();
  const [creating, setCreating] = useState(false);

  const createAddress = async (values: BillingAddressFormValues) => {
    try {
      const sanitizeOptional = (v: string | undefined | null) => {
        const t = (v ?? "").trim();
        return t.length > 0 ? t : null;
      };

      const payload = {
        ...values,
        name: sanitizeOptional(values.name),
        surname: sanitizeOptional(values.surname),
        legalName: sanitizeOptional(values.legalName),
        taxOffice: sanitizeOptional(values.taxOffice),
        mersis: sanitizeOptional(values.mersis),
        tckn: values.type === "INDIVIDUAL" && values.taxpayerInvoice ? sanitizeOptional(values.tckn) : null,
        vkn: values.type === "CORPORATE" ? sanitizeOptional(values.vkn) : null,
      };

      await getSiteSameOriginAxios().post("/account/billing-addresses", payload);
      await invalidateBillingAddresses(queryClient);
      setCreating(false);
      notify("info", "Fatura adresiniz kaydedildi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fatura adresi kaydedilemedi.");
    }
  };

  const removeAddress = async (id: number) => {
    try {
      await getSiteSameOriginAxios().delete(`/account/billing-addresses/${id}`);
      await invalidateBillingAddresses(queryClient);
      notify("info", "Fatura adresi silindi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fatura adresi silinemedi.");
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
          <h1 className="text-2xl font-semibold tracking-tight">Fatura Adreslerim</h1>
          <p className="text-sm text-muted-foreground">Satın alımlarınızda kullanacağınız adresleri yönetin.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setCreating((value) => !value)}>
          <Plus className="h-4 w-4" />
          Yeni adres
        </Button>
      </div>

      {creating && (
        <Card className="glow-card">
          <CardContent className="p-6">
            <BillingAddressForm onSubmit={createAddress} />
          </CardContent>
        </Card>
      )}

      {addresses.isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : addresses.isError ? (
        <p className="text-sm text-destructive">Fatura adresleri yüklenemedi.</p>
      ) : addresses.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.data.map((address) => (
            <Card key={address.id} className="glow-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-medium">{displayBillingName(address)}</h2>
                        {address.defaultAddress && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Varsayılan</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {address.type === "CORPORATE" ? "Kurumsal" : "Bireysel"}
                      </p>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {[address.district, address.city, address.postcode, address.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => void removeAddress(address.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Henüz kayıtlı fatura adresiniz yok.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
