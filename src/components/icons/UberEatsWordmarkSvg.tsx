import { cn } from "@/lib/utils";

type UberEatsWordmarkSvgProps = {
  className?: string;
};

export const UBER_EATS_GREEN = "#0BC167";

export function UberEatsWordmarkSvg({ className }: UberEatsWordmarkSvgProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline text-3xl font-bold tracking-[-0.03em] sm:text-4xl",
        className,
      )}
      role="img"
      aria-label="Uber Eats"
    >
      <span className="text-black dark:text-foreground">Uber</span>
      <span style={{ color: UBER_EATS_GREEN }}>Eats</span>
    </span>
  );
}
