"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, MapPin, Plus } from "lucide-react";

import BillingAddressForm from "@/components/dashboard/commerce/BillingAddressForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function shortAddressLine(value: string | null | undefined, max = 36): string {
  const text = (value ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function toFormValues(address: BillingAddress): BillingAddressFormValues {
  return {
    type: address.type,
    title: address.title ?? "",
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

      <Dialog
        open={editingId != null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adresi düzenle</DialogTitle>
            <DialogDescription>
              {editingAddress
                ? `${displayBillingName(editingAddress)} adres bilgilerini güncelleyin.`
                : "Fatura adresi bilgilerini güncelleyin."}
            </DialogDescription>
          </DialogHeader>
          {editingAddress ? (
            <BillingAddressForm
              key={editingAddress.id}
              submitLabel="Adresi Güncelle"
              initialValues={toFormValues(editingAddress)}
              onSubmit={(values) => updateAddress(editingAddress.id, values)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {addresses.isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : addresses.isError ? (
        <p className="text-sm text-destructive">
          {addresses.error instanceof ApiError
            ? addresses.error.message
            : "Fatura adresleri yüklenemedi."}
        </p>
      ) : addresses.data?.length ? (
        <div className="space-y-3">
          {addresses.data.map((address) => {
            const street = shortAddressLine(address.address, 28);
            return (
              <Card key={address.id} className="glow-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-sm">
                    <span className="shrink-0 font-medium">{displayBillingName(address)}</span>
                    {address.defaultAddress && (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        Aktif
                      </span>
                    )}
                    {street ? (
                      <>
                        <span className="h-4 w-px shrink-0 bg-border" />
                        <span className="min-w-0 truncate text-muted-foreground" title={address.address}>
                          {street}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
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
                    <a
                      href="#duzenle"
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={(event) => {
                        event.preventDefault();
                        setCreating(false);
                        setEditingId(address.id);
                      }}
                    >
                      Düzenle
                    </a>
                    <a
                      href="#sil"
                      className="text-destructive underline-offset-4 hover:underline"
                      onClick={(event) => {
                        event.preventDefault();
                        void removeAddress(address.id);
                      }}
                    >
                      Sil
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
