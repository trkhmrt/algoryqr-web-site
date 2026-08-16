import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MediaPlaceholderProps = {
  label: string;
  hint?: string;
  aspect?: "phone" | "wide" | "square";
  className?: string;
};

const aspectClass = {
  phone: "aspect-[9/19] max-w-[280px]",
  wide: "aspect-[16/10]",
  square: "aspect-square max-w-md",
} as const;

export function MediaPlaceholder({
  label,
  hint,
  aspect = "wide",
  className,
}: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border/80 bg-muted/30",
        aspectClass[aspect],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_55%)]" />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80">
          <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
