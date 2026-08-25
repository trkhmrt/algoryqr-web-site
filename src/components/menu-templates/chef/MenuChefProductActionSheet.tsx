"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info, UtensilsCrossed, Wine } from "lucide-react";

import { PopoverContent } from "@/components/ui/popover";

type MenuChefProductActionSheetProps = {
  productName: string;
  onClose: () => void;
  onProductDetail: () => void;
};

type ActionOption = {
  key: string;
  label: string;
  icon: typeof Info;
  onClick: () => void;
};

export function MenuChefProductActionSheet({
  productName,
  onClose,
  onProductDetail,
}: MenuChefProductActionSheetProps) {
  const options: ActionOption[] = [
    {
      key: "pair",
      label: "Yanına ne iyi gider?",
      icon: Wine,
      onClick: onClose,
    },
    {
      key: "follow",
      label: "Sonrasında ne iyi gider?",
      icon: UtensilsCrossed,
      onClick: onClose,
    },
    {
      key: "detail",
      label: "Ürün detayı",
      icon: Info,
      onClick: () => {
        onProductDetail();
        onClose();
      },
    },
  ];

  return (
    <PopoverContent
      side="top"
      align="center"
      sideOffset={10}
      collisionPadding={16}
      aria-label={`${productName} seçenekleri`}
      className="z-[90] w-[15.75rem] rounded-[1rem] border border-white/80 bg-white/95 p-1.5 text-[#1c2824] shadow-[0_12px_36px_rgba(28,40,36,0.16)] backdrop-blur-xl"
    >
      <div className="flex flex-col">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={option.onClick}
              className="flex w-full items-center gap-2.5 rounded-[0.75rem] px-2.5 py-2 text-left transition hover:bg-[#f3f5f4]"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef1ef] text-[#2a3833]">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
              </span>
              <span className="text-[12.5px] font-medium leading-snug tracking-[-0.01em] text-[#1c2824]">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      <PopoverPrimitive.Arrow className="fill-white" width={12} height={7} />
    </PopoverContent>
  );
}
