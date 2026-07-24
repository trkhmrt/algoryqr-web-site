"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateBillingAddresses, useBillingAddresses } from "@/hooks/use-commerce";
import { ApiError } from "@/lib/api";
import {
  buildBillingAddressPayload,
  displayBillingName,
  type BillingAddress,
  type BillingAddressForm as BillingAddressFormValues,
} from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

function toFormValues(address: BillingAddress): BillingAddressFormValues {
  return {
    type: address.type,
    name: address.name ?? "",
    surname: address.surname ?? "",
    legalName: address.legalName ?? "",
    tckn: address.tckn ?? "",
    vkn: address.vkn ?? "",
    taxOffice: address.taxOffice ?? "",
    mersis: address.mersis ?? "",
    country: address.country,
    city: address.city,
    district: address.district,
    address: address.address,
    postcode: address.postcode,
    email: address.email,
    phone: address.phone,
    taxpayerInvoice: Boolean(address.taxpayerInvoice),
    defaultAddress: Boolean(address.defaultAddress),
  };
}

export default function BillingAddressesView() {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const addresses = useBillingAddresses();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createAddress = async (values: BillingAddressFormValues) => {
    try {
      await getSiteSameOriginAxios().post(
        "/account/billing-addresses",
        buildBillingAddressPayload(values),
      );
      await invalidateBillingAddresses(queryClient);
      setCreating(false);
      notify("info", "Fatura adresiniz kaydedildi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fatura adresi kaydedilemedi.");
    }
  };

  const updateAddress = async (id: number, values: BillingAddressFormValues) => {
    try {
      await getSiteSameOriginAxios().put(
        `/account/billing-addresses/${id}`,
        buildBillingAddressPayload(values),
      );
      await invalidateBillingAddresses(queryClient);
      setEditingId(null);
      notify("info", "Fatura adresiniz güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fatura adresi güncellenemedi.");
    }
  };

  const makeActive = async (id: number) => {
    try {
      await getSiteSameOriginAxios().put(`/account/billing-addresses/${id}/default`);
      await invalidateBillingAddresses(queryClient);
      notify("info", "Aktif fatura adresi güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Aktif fatura adresi ayarlanamadı.");
    }
  };

  const removeAddress = async (id: number) => {
    try {
      await getSiteSameOriginAxios().delete(`/account/billing-addresses/${id}`);
      await invalidateBillingAddresses(queryClient);
      if (editingId === id) setEditingId(null);
      notify("info", "Fatura adresi silindi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fatura adresi silinemedi.");
    }
  };

  const editingAddress = addresses.data?.find((item) => item.id === editingId) ?? null;

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
          <p className="text-sm text-muted-foreground">
            Aktif adres ödeme sayfasında varsayılan seçilir; istediğiniz zaman değiştirebilirsiniz.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            setEditingId(null);
            setCreating((value) => !value);
          }}
        >
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

      {editingAddress && (
        <Card className="glow-card">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium">Adresi düzenle</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                Vazgeç
              </Button>
            </div>
            <BillingAddressForm
              key={editingAddress.id}
              submitLabel="Adresi Güncelle"
              initialValues={toFormValues(editingAddress)}
              onSubmit={(values) => updateAddress(editingAddress.id, values)}
            />
          </CardContent>
        </Card>
      )}

      {addresses.isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : addresses.isError ? (
        <p className="text-sm text-destructive">
          {addresses.error instanceof ApiError
            ? addresses.error.message
            : "Fatura adresleri yüklenemedi."}
        </p>
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
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {address.type === "CORPORATE" ? "Kurumsal" : "Bireysel"}
                      </p>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {[address.district, address.city, address.postcode, address.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!address.defaultAddress && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => void makeActive(address.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aktif yap
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setCreating(false);
                            setEditingId(address.id);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Düzenle
                        </Button>
                      </div>
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
