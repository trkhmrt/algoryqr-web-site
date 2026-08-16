"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { getOrder } from "@/lib/ordering-api";
import { produceCampaignReward, type ProduceRewardResponse } from "@/lib/public-campaign-api";

import { usePublicMenuTheme } from "./public-menu-theme";

type OrderSuccessOverlayProps = {
  orderId: number;
  identifier: string;
  sessionToken: string | null;
  onDone: () => void;
};

function buildQrImageUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}

export function OrderSuccessOverlay({
  orderId,
  identifier,
  sessionToken,
  onDone,
}: OrderSuccessOverlayProps) {
  const theme = usePublicMenuTheme();
  const [status, setStatus] = useState<string>("SUBMITTED");
  const [campaignHint, setCampaignHint] = useState<string | null>(null);
  const [rewardEligible, setRewardEligible] = useState(false);
  const [producing, setProducing] = useState(false);
  const [produceError, setProduceError] = useState<string | null>(null);
  const [produceResult, setProduceResult] = useState<ProduceRewardResponse | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      if (cancelled || attempts > 120 || !sessionToken) return;
      attempts += 1;
      try {
        const order = await getOrder(identifier, sessionToken, orderId);
        if (cancelled) return;
        setStatus(order.status);
        const summary = order.campaignSummary;
        if (summary?.hint) setCampaignHint(summary.hint);
        if (summary?.rewardEligible) setRewardEligible(true);
        if (order.status !== "CONFIRMED" && order.status !== "REJECTED" && order.status !== "CANCELLED") {
          window.setTimeout(() => void poll(), 3000);
        }
      } catch {
        if (!cancelled && attempts < 120) {
          window.setTimeout(() => void poll(), 4000);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [identifier, orderId, sessionToken]);

  const handleProduce = useCallback(async () => {
    setProducing(true);
    setProduceError(null);
    try {
      const result = await produceCampaignReward(identifier, orderId);
      setProduceResult(result);
    } catch (err) {
      setProduceError(err instanceof Error ? err.message : "Ödül üretilemedi.");
    } finally {
      setProducing(false);
    }
  }, [identifier, orderId]);

  if (typeof document === "undefined") return null;

  const claimUrl =
    produceResult?.claimUrl ??
    (produceResult?.claimToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/reward/claim?c=${encodeURIComponent(produceResult.claimToken)}`
      : null);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "color-mix(in srgb, #1a1a1a 45%, transparent)" }}
      onClick={onDone}
    >
      <motion.div
        className={`${theme.rootClassName} relative w-full max-w-sm rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-card)] px-6 py-10 text-center shadow-2xl`}
        initial={{ scale: 0.82, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <style>{theme.styles}</style>

        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          <svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden>
            <motion.path
              d="M14 27.5 L22.5 36 L38 16"
              fill="none"
              stroke="var(--lx-primary-fg)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            />
          </svg>
        </motion.div>

        <p className="mt-5 font-display text-2xl font-semibold text-gradient-gold">
          Siparişiniz alındı
        </p>
        <p className="mt-2 text-sm lx-muted">#{orderId}</p>

        {status === "SUBMITTED" ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm lx-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Garson onayı bekleniyor…
          </p>
        ) : null}

        {status === "CONFIRMED" ? (
          <p className="mt-3 text-sm text-emerald-600">Sipariş onaylandı.</p>
        ) : null}

        {campaignHint ? (
          <p className="mt-3 text-xs lx-muted">{campaignHint}</p>
        ) : null}

        {status === "CONFIRMED" && rewardEligible && !produceResult ? (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              disabled={producing}
              onClick={() => void handleProduce()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-5 text-sm font-semibold text-[var(--lx-primary-fg)] disabled:opacity-60"
            >
              {producing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ödül Üret
            </button>
            {produceError ? <p className="text-xs text-red-500">{produceError}</p> : null}
          </div>
        ) : null}

        {produceResult ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm lx-muted">
              {produceResult.message ??
                (produceResult.autoAssigned
                  ? "Ödül hesabınıza eklendi."
                  : "QR okutarak giriş yapın, hak tanımlansın.")}
            </p>
            {!produceResult.autoAssigned && claimUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildQrImageUrl(claimUrl)}
                  alt="Claim QR"
                  className="mx-auto rounded-lg border border-[var(--lx-border)]"
                />
                <a
                  href={claimUrl}
                  className="block truncate text-xs text-[var(--lx-gold)] underline"
                >
                  {claimUrl}
                </a>
              </>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onDone}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-[var(--lx-border)] px-5 text-sm font-medium lx-fg"
        >
          Tamam
        </button>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
