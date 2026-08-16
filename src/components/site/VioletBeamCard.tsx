import { cn } from "@/lib/utils";

type VioletBeamCardProps = {
  className?: string;
  children: React.ReactNode;
};

export function VioletBeamCard({ className, children }: VioletBeamCardProps) {
  return <div className={cn("violet-beam rounded-3xl", className)}>{children}</div>;
}
