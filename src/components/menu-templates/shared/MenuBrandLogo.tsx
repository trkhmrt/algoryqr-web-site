import { cn } from "@/lib/utils";

type MenuBrandLogoProps = {
  logoUrl?: string | null;
  businessName: string;
  className?: string;
  imgClassName?: string;
  size?: number;
};

export function MenuBrandLogo({
  logoUrl,
  businessName,
  className,
  imgClassName,
  size = 48,
}: MenuBrandLogoProps) {
  const src = logoUrl?.trim();
  if (!src) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 shadow-sm ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={businessName.trim() || "Logo"}
        className={cn("h-full w-full object-contain p-1", imgClassName)}
      />
    </span>
  );
}
