"use client";

import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FeatureHintContent } from "@/lib/product-hints";
import { getProductHintByCode } from "@/lib/product-hints";
import { cn } from "@/lib/utils";

export type { FeatureHintContent };

type FeatureHintProps = FeatureHintContent & {
  size?: "sm" | "md";
  className?: string;
};

export function FeatureHint({ title, description, size = "md", className }: FeatureHintProps) {
  const [open, setOpen] = useState(false);
  const buttonSize = size === "sm" ? "h-4 w-4 text-[10px]" : "h-5 w-5 text-[11px]";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full border border-border font-semibold leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            buttonSize,
            className,
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(event) => {
            event.preventDefault();
            setOpen((prev) => !prev);
          }}
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm leading-relaxed"
        align="start"
        side="bottom"
        sideOffset={8}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </PopoverContent>
    </Popover>
  );
}

export function FeatureHintByProduct({
  productCode,
  size = "md",
  className,
}: {
  productCode: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const hint = getProductHintByCode(productCode);
  return <FeatureHint {...hint} size={size} className={className} />;
}
