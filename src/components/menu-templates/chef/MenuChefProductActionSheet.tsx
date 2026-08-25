"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Info, UtensilsCrossed, Wine } from "lucide-react";
import { useEffect } from "react";

type MenuChefProductActionSheetProps = {
  open: boolean;
  productName: string;
  onClose: () => void;
  onProductDetail: () => void;
};

type ActionOption = {
  key: string;
  label: string;
  description: string;
  icon: typeof Info;
  onClick: () => void;
};

export function MenuChefProductActionSheet({
  open,
  productName,
  onClose,
  onProductDetail,
}: MenuChefProductActionSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const options: ActionOption[] = [
    {
      key: "pair",
      label: "Yanına ne iyi gider?",
      description: "Bu ürünle birlikte önerilecek seçenekler",
      icon: Wine,
      onClick: onClose,
    },
    {
      key: "follow",
      label: "Sonrasında ne iyi gider?",
      description: "Bu üründen sonra önerilecek seçenekler",
      icon: UtensilsCrossed,
      onClick: onClose,
    },
    {
      key: "detail",
      label: "Ürün detayı",
      description: "Fiyat, içerik ve besin bilgileri",
      icon: Info,
      onClick: () => {
        onProductDetail();
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chef-product-action-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} seçenekleri`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[85] flex items-end justify-center bg-[#0f1613]/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[1px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="w-full max-w-md overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(28,40,36,0.18)] backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#1c2824]/[0.06] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a9a93]">
                Seçenekler
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1c2824]">
                {productName}
              </p>
            </div>
            <div className="p-2">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={option.onClick}
                    className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-[#f3f5f4]"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef1ef] text-[#2a3833]">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold tracking-[-0.01em] text-[#1c2824]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-[#6b7a73]">
                        {option.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#9aa9a2]" strokeWidth={2.25} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
