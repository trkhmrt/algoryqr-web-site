"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import {
  getCardVerificationStatus,
  isCardVerificationConversation,
  resolveCardVerificationReturnPath,
} from "@/lib/card-verification";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { abandonPendingPaymentAttempt } from "@/lib/purchase-fulfillment";

function resolvePaymentRedirect(status: string | null): "success" | "failed" | "unknown" {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized === "success" || normalized === "successful" || normalized === "refunded") return "success";
  if (normalized === "failed" || normalized === "failure") return "failed";
  return "unknown";
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("conversationId");
  const cardVerification = isCardVerificationConversation(conversationId);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [verificationTimedOut, setVerificationTimedOut] = useState(false);
  const payment = resolvePaymentRedirect(
    cardVerification && verificationStatus
      ? verificationStatus
      : cardVerification
        ? null
        : searchParams.get("status"),
  );

  useEffect(() => {
    if (!cardVerification || !conversationId) return;

    let active = true;
    let timer: number | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const response = await getCardVerificationStatus(conversationId);
        if (!active) return;
        setVerificationStatus(response.status);
        if (response.status.trim().toUpperCase() !== "INITIATED") return;
      } catch {
        // PayTR callback processing may briefly race with the browser redirect.
      }

      if (active && Date.now() - startedAt < 90_000) {
        timer = window.setTimeout(() => void poll(), 2_000);
      } else if (active) {
        setVerificationTimedOut(true);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [cardVerification, conversationId]);

  const redirectTarget = useMemo(() => {
    if (cardVerification) {
      const returnPath = resolveCardVerificationReturnPath(DASHBOARD_ROUTES.accountPaymentMethods);
      return `${returnPath}?verification=${payment}`;
    }
    return `${DASHBOARD_ROUTES.accountSubscription}?payment=${payment}`;
  }, [cardVerification, payment]);

  useEffect(() => {
    if (window.self !== window.top) {
      window.top!.location.assign(redirectTarget);
      return;
    }

    if (payment === "failed" && !cardVerification) {
      void abandonPendingPaymentAttempt({ cancelIfPending: true });
    }

    if (cardVerification && !verificationTimedOut && payment !== "success" && payment !== "failed") {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(redirectTarget);
    }, cardVerification ? 300 : 2500);

    return () => window.clearTimeout(timer);
  }, [cardVerification, payment, redirectTarget, router, verificationTimedOut]);

  const isSuccess = payment === "success";
  const isFailed = payment === "failed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <BrandLogo size="lg" className="mx-auto" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {isSuccess ? (
            <CheckCircle2 className="h-8 w-8 text-primary" />
          ) : isFailed ? (
            <XCircle className="h-8 w-8 text-destructive" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {cardVerification
              ? isSuccess
                ? "Kart doğrulama başarılı"
                : isFailed
                  ? "Kart doğrulama başarısız"
                : verificationTimedOut
                  ? "Kart doğrulama sonucu gecikiyor"
                  : "Kart doğrulama sonucu alınıyor"
              : isSuccess
                ? "Ödeme başarılı"
                : isFailed
                  ? "Ödeme başarısız"
                  : "Ödeme sonucu alınıyor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cardVerification
              ? isSuccess
                ? "Kartınız kaydediliyor. Kayıtlı kartlar sayfasına yönlendiriliyorsunuz…"
                : isFailed
                  ? "Kart doğrulanamadı. Kayıtlı kartlar sayfasına yönlendiriliyorsunuz…"
                  : verificationTimedOut
                    ? "PayTR bildirimi henüz ulaşmadı. Kayıtlı kartlar sayfasından tekrar kontrol edebilirsiniz."
                    : "PayTR bildirimi bekleniyor…"
              : isSuccess
                ? "Paketiniz kısa süre içinde hesabınıza tanımlanacak. Abonelik sayfasına yönlendiriliyorsunuz…"
                : isFailed
                  ? "Ödeme tamamlanamadı. Abonelik sayfasına yönlendiriliyorsunuz…"
                  : "Lütfen bekleyin…"}
          </p>
        </div>

        <Button variant="outline" onClick={() => router.replace(redirectTarget)}>
          {cardVerification ? "Kartlarıma git" : "Aboneliğe git"}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
