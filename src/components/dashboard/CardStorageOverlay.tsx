"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Loader2 } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DASHBOARD_SURFACE } from "@/lib/dashboard-surface";

export type CardStorageSession = {
  conversationId: string;
  actionUrl: string;
  fields: Record<string, string>;
};

type CardStorageOverlayProps = {
  session: CardStorageSession;
  onClose: () => void;
};

export function CardStorageOverlay({ session, onClose }: CardStorageOverlayProps) {
  const [portalReady, setPortalReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.history.pushState({ algoryCardStorage: session.conversationId }, "");
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose, session.conversationId]);

  const handleCancel = () => {
    window.history.back();
    onClose();
  };

  if (!portalReady) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col bg-[linear-gradient(160deg,#ffffff_0%,#f7f7f8_58%,#f1f1f2_100%)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Kart kaydı</p>
            <p className="truncate text-xs text-muted-foreground">AlgoryQR güvenli kart saklama</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={submitting}>
          İptal
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-[420px] space-y-4">
          <div
            className={`${DASHBOARD_SURFACE} flex h-[156px] flex-col justify-between bg-[linear-gradient(145deg,#fff_0%,#fafafa_55%,#f4f4f5_100%)] p-5`}
            aria-hidden
          >
            <div className="flex items-center justify-between">
              <span className="h-6 w-8 rounded-md border border-[#d4d4d4] bg-[linear-gradient(135deg,#ececec,#d4d4d4_55%,#ececec)]" />
              <span className="text-sm font-bold tracking-wide">AlgoryQR</span>
            </div>
            <p className="font-mono text-[15px] tracking-[0.18em] text-muted-foreground">
              •••• •••• •••• ••••
            </p>
            <div className="flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
              <span>Kart sahibi</span>
              <span>AA / YY</span>
            </div>
          </div>

          <form
            action={session.actionUrl}
            method="post"
            acceptCharset="UTF-8"
            className={`${DASHBOARD_SURFACE} space-y-4 p-5`}
            onSubmit={() => setSubmitting(true)}
          >
            <div className="space-y-1">
              <h1 className="text-lg font-bold tracking-tight">Kartı kaydet</h1>
              <p className="text-sm text-muted-foreground">
                Kart bilgileri doğrudan PayTR&apos;ye gider. 1 TL çekilir, ardından otomatik iade edilir.
              </p>
            </div>

            {Object.entries(session.fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}

            <div className="space-y-2">
              <Label htmlFor="cc_owner">Kart sahibi</Label>
              <Input id="cc_owner" name="cc_owner" required maxLength={50} autoComplete="cc-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_number">Kart numarası</Label>
              <Input
                id="card_number"
                name="card_number"
                required
                inputMode="numeric"
                maxLength={19}
                autoComplete="cc-number"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiry_month">Ay</Label>
                <Input
                  id="expiry_month"
                  name="expiry_month"
                  required
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  autoComplete="cc-exp-month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_year">Yıl</Label>
                <Input
                  id="expiry_year"
                  name="expiry_year"
                  required
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="YY"
                  autoComplete="cc-exp-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="cc-csc"
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Kartı kaydet ve 1 TL doğrula
            </Button>
            <p className="text-xs text-muted-foreground">
              Numara sunucumuza gelmez. Ödeme PayTR Direct API üzerinden tamamlanır.
            </p>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
