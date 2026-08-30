"use client";

import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { initiateCardVerification } from "@/lib/card-verification";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { isPaytrCheckout, paytrCheckoutHtml } from "@/lib/paytr-checkout";
import Link from "next/link";

type CardVerificationPanelProps = {
  title?: string;
  description?: string;
};

export function CardVerificationPanel({
  title = "Kredi kartı ekle",
  description = "Kart bilgileri PayTR’da saklanır. 1 TL doğrulama çekilir ve iade edilir. Deneme bitince aynı karttan paket bedeli alınır.",
}: CardVerificationPanelProps) {
  const { notify } = useDashboardBanners();
  const [starting, setStarting] = useState(false);
  const [overlay, setOverlay] = useState<PaymentCheckoutOverlayContent | null>(null);

  const start = async () => {
    setStarting(true);
    try {
      const response = await initiateCardVerification();
      if (response.paymentPageUrl) {
        setOverlay({ kind: "url", content: response.paymentPageUrl });
        return;
      }
      if (response.checkoutFormContent) {
        setOverlay({
          kind: "html",
          content: paytrCheckoutHtml(response.checkoutFormContent),
        });
        return;
      }
      notify("danger", "PayTR ödeme ekranı açılamadı.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Kart doğrulama başlatılamadı.";
      notify("danger", message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">
            PayTR ekranında kart kaydını onaylayın. Onaysız kart kaydedilmez. Fatura adresi ve telefon
            zorunludur.{" "}
            <Link href={DASHBOARD_ROUTES.accountBillingAddresses} className="text-primary underline">
              Fatura adresi
            </Link>
          </p>
        </div>
      </div>
      <Button className="w-full gap-2" disabled={starting} onClick={() => void start()}>
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Kartı PayTR ile kaydet
      </Button>
      {overlay ? (
        <PaymentCheckoutOverlay
          overlay={overlay}
          title={isPaytrCheckout(overlay) ? "Kart kaydı (PayTR)" : "Kart kaydı"}
          onClose={() => setOverlay(null)}
        />
      ) : null}
    </div>
  );
}
