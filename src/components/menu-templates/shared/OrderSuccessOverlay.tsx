"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

import { usePublicMenuTheme } from "./public-menu-theme";

type OrderSuccessOverlayProps = {
  orderId: number;
  onDone: () => void;
};

export function OrderSuccessOverlay({ orderId, onDone }: OrderSuccessOverlayProps) {
  const theme = usePublicMenuTheme();

  useEffect(() => {
    const timeout = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  if (typeof document === "undefined") return null;

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
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.span
            key={index}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--lx-gold-soft, var(--lx-gold))",
              left: `${18 + (index % 3) * 32}%`,
              top: index < 3 ? "12%" : "78%",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.2], y: [0, -12, -22] }}
            transition={{ delay: 0.35 + index * 0.08, duration: 1.1, ease: "easeOut" }}
          />
        ))}

        <motion.div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-gold"
          style={{
            boxShadow: "0 0 0 8px color-mix(in srgb, var(--lx-gold) 22%, transparent)",
          }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.08 }}
        >
          <svg viewBox="0 0 52 52" className="h-12 w-12" aria-hidden>
            <motion.path
              d="M14 27.5 L22.5 36 L38 16"
              fill="none"
              stroke="var(--lx-primary-fg)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, delay: 0.35, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        <motion.p
          className="mt-6 font-display text-2xl font-semibold text-gradient-gold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          Siparişiniz alındı
        </motion.p>
        <motion.p
          className="mt-2 text-sm lx-muted"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          #{orderId} · Garson onayı bekleniyor
        </motion.p>
        <motion.button
          type="button"
          onClick={onDone}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-gradient-gold px-5 text-sm font-semibold text-[var(--lx-primary-fg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Tamam
        </motion.button>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
