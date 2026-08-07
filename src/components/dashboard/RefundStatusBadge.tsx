"use client";

import { Badge } from "@/components/ui/badge";
import {
  isRefundCompleted,
  isRefundInFlight,
  refundStatusLabel,
} from "@/lib/refund-display";
import { cn } from "@/lib/utils";

type RefundStatusBadgeProps = {
  refundEligible?: boolean | null;
  refundStatus?: string | null;
  refundedAt?: string | null;
  className?: string;
};

export default function RefundStatusBadge({
  refundStatus,
  refundedAt,
  className,
}: RefundStatusBadgeProps) {
  if (isRefundInFlight(refundStatus)) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
          className,
        )}
      >
        {refundStatusLabel(refundStatus)}
      </Badge>
    );
  }

  if (isRefundCompleted(refundStatus, refundedAt)) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
          className,
        )}
      >
        {refundStatusLabel(refundStatus) ?? "İade edildi"}
      </Badge>
    );
  }

  return null;
}
