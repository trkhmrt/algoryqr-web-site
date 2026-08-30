"use client";

import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { CardStorageOverlay, type CardStorageSession } from "@/components/dashboard/CardStorageOverlay";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { initiateCardVerification, persistCardVerificationReturn } from "@/lib/card-verification";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_SURFACE } from "@/lib/dashboard-surface";

type CardVerificationPanelProps = {
  title?: string;
  description?: string;
  returnPath?: string;
};

export function CardVerificationPanel({
  title = "Kredi kartı ekle",
  description = "Kart bilgileri doğrudan PayTR'ye iletilir ve orada saklanır. 1 TL doğrulama çekilir, ardından otomatik iade edilir. Deneme bitince aynı karttan paket bedeli alınır.",
  returnPath = DASHBOARD_ROUTES.accountPaymentMethods,
}: CardVerificationPanelProps) {
  const { notify } = useDashboardBanners();
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<CardStorageSession | null>(null);

  const start = async () => {
    setStarting(true);
    try {
      persistCardVerificationReturn(returnPath);
      const response = await initiateCardVerification();
      if (!response.actionUrl || !response.fields) {
        notify("danger", "Kart kayıt oturumu açılamadı.");
        return;
      }
      setSession({
        conversationId: response.conversationId,
        actionUrl: response.actionUrl,
        fields: response.fields,
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Kart doğrulama başlatılamadı.";
      notify("danger", message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className={`${DASHBOARD_SURFACE} space-y-4 p-5`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">
            Kart numarası sunucumuza gelmez; form doğrudan PayTR&apos;ye gider. Fatura adresi ve telefon
            zorunludur.{" "}
            <Link href={DASHBOARD_ROUTES.accountBillingAddresses} className="text-primary underline">
              Fatura adresi
            </Link>
          </p>
        </div>
      </div>
      <Button className="w-full gap-2" disabled={starting} onClick={() => void start()}>
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Kartı kaydet
      </Button>
      {session ? <CardStorageOverlay session={session} onClose={() => setSession(null)} /> : null}
    </div>
  );
}
