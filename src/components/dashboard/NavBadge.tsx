import { cn } from "@/lib/utils";

type NavBadgeProps = {
  count: number;
  className?: string;
};

export function NavBadge({ count, className }: NavBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground",
        className,
      )}
      aria-label={`${count} bekleyen sipariş`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
