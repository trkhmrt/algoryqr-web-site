"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateBranches } from "@/hooks/use-branches";
import { ApiError, getApiErrorCode } from "@/lib/api";
import { createBranchRequest } from "@/lib/branch";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";

export default function BranchCreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      notify("warning", "Şube adı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const created = await createBranchRequest({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      await invalidateBranches(queryClient);
      notify("info", "Şube oluşturuldu.");
      router.push(DASHBOARD_ROUTES.digitalMenuCreateForBranch(created.id));
    } catch (error) {
      if (getApiErrorCode(error) === "EXTRA_BRANCH_REQUIRED") {
        router.push(DASHBOARD_ROUTES.catalogProductCheckout("QR_BRANCH"));
        return;
      }
      notify("danger", error instanceof ApiError ? error.message : "Şube oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Yeni şube" hint="İsim, adres ve iletişim bilgilerini girin." />
        <DashboardLoadingState label="Şube formu hazırlanıyor…" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Şube eklemek için aktif paket gerekir.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Yeni şube"
        hint="İsim, adres ve iletişim bilgilerini girin."
        back={
          <Link href={DASHBOARD_ROUTES.digitalMenu} aria-label="Menüye dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />
      <div className={`${DASHBOARD_PANEL} space-y-4`}>
        <div className="space-y-2">
          <Label htmlFor="branch-name">Şube adı</Label>
          <Input id="branch-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-address">Adres</Label>
          <Input id="branch-address" value={address} onChange={(event) => setAddress(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-phone">Telefon</Label>
          <Input id="branch-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-email">E-posta</Label>
          <Input id="branch-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}>
          Vazgeç
        </Button>
        <Button variant="hero" disabled={saving} onClick={() => void submit()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Şube oluştur"}
        </Button>
      </div>
    </div>
  );
}
