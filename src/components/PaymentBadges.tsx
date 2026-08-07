import { cn } from "@/lib/utils";

const BADGES = [
  { src: "/payment-logos/iyzico.svg", alt: "iyzico ile Öde", width: 108, height: 36 },
  { src: "/payment-logos/visa.svg", alt: "Visa", width: 72, height: 24 },
  { src: "/payment-logos/mastercard.svg", alt: "Mastercard", width: 56, height: 36 },
] as const;

type PaymentBadgesProps = {
  className?: string;
  label?: string;
};

export default function PaymentBadges({
  className,
  label = "Güvenli ödeme",
}: PaymentBadgesProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {label ? (
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        {BADGES.map((badge) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={badge.src}
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className="h-7 w-auto object-contain md:h-8"
          />
        ))}
      </div>
    </div>
  );
}
