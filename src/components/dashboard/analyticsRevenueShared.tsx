"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  Banknote,
  Bike,
  CreditCard,
  Coins,
  PackageX,
  Receipt,
  ShoppingBag,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import type { RevenueKpiId, SpotlightCard, UnsoldSpotlightCard } from "@/reporting";
import { cn } from "@/lib/utils";

const c = (token: string) => `hsl(var(--chart-${token}))`;

export const REVENUE_COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  violet: c("violet"),
  orange: c("orange"),
  red: c("red"),
};

export const REVENUE_PIE_FILLS = [
  REVENUE_COLORS.indigo,
  REVENUE_COLORS.teal,
  REVENUE_COLORS.green,
  REVENUE_COLORS.violet,
  REVENUE_COLORS.orange,
];

export const KPI_ICONS: Record<RevenueKpiId, LucideIcon> = {
  totalRevenue: Banknote,
  confirmedOrderCount: Receipt,
  soldItemCount: ShoppingBag,
  averageBasket: Wallet,
};

export const KPI_COLORS: Record<RevenueKpiId, string> = {
  totalRevenue: REVENUE_COLORS.green,
  confirmedOrderCount: REVENUE_COLORS.indigo,
  soldItemCount: REVENUE_COLORS.teal,
  averageBasket: REVENUE_COLORS.orange,
};

export type BreakdownItem = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  emphasize?: boolean;
};

export type KpiDisplay = {
  id: RevenueKpiId;
  label: string;
  display: string;
  icon: LucideIcon;
  color: string;
};

export type RevenueRow = {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
  share: number;
};

export function buildBreakdownItems(breakdown: {
  cashRevenue?: number | string | null;
  cardRevenue?: number | string | null;
  tipRevenue?: number | string | null;
  uberEatsRevenue?: number | string | null;
  grossRevenue?: number | string | null;
  fixedExpenseTotal?: number | string | null;
  netRevenue?: number | string | null;
}): BreakdownItem[] {
  const n = (v: number | string | null | undefined) => Number(v ?? 0);
  return [
    { label: "Nakit", value: n(breakdown.cashRevenue), icon: Banknote, color: REVENUE_COLORS.green },
    { label: "Kart", value: n(breakdown.cardRevenue), icon: CreditCard, color: REVENUE_COLORS.indigo },
    { label: "Bahşiş", value: n(breakdown.tipRevenue), icon: Coins, color: REVENUE_COLORS.orange },
    {
      label: "Uber Eats",
      value: n(breakdown.uberEatsRevenue),
      icon: Bike,
      color: REVENUE_COLORS.indigo,
    },
    { label: "Brüt ciro", value: n(breakdown.grossRevenue), icon: Wallet, color: REVENUE_COLORS.teal },
    {
      label: "Sabit gider",
      value: n(breakdown.fixedExpenseTotal),
      icon: Receipt,
      color: REVENUE_COLORS.red,
    },
    {
      label: "Net ciro",
      value: n(breakdown.netRevenue),
      icon: Trophy,
      color: REVENUE_COLORS.violet,
      emphasize: true,
    },
  ];
}

export function SpotlightProductCard({
  card,
  icon: Icon,
  color,
  metric,
  compact,
}: {
  card: SpotlightCard;
  icon: LucideIcon;
  color: string;
  metric?: string;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card",
        compact && "min-w-[11.5rem] snap-start",
      )}
    >
      <div className={cn("flex flex-col gap-2", compact ? "p-3.5" : "gap-3 p-5")}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <p className="text-xs font-semibold leading-tight text-muted-foreground sm:text-sm sm:text-foreground">
            {card.label}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {card.display}
          </p>
          {metric ? <p className="mt-0.5 text-xs text-muted-foreground">{metric}</p> : null}
        </div>
      </div>
    </motion.div>
  );
}

export function UnsoldCard({ card, compact }: { card: UnsoldSpotlightCard; compact?: boolean }) {
  const preview = card.products
    .slice(0, 3)
    .map((row) => row.name)
    .join(", ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card",
        compact && "min-w-[11.5rem] snap-start",
      )}
    >
      <div className={cn("flex flex-col gap-2", compact ? "p-3.5" : "gap-3 p-5")}>
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4 shrink-0" style={{ color: REVENUE_COLORS.red }} />
          <p className="text-xs font-semibold leading-tight text-muted-foreground sm:text-sm sm:text-foreground">
            {card.label}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{card.display}</p>
          {preview ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Hepsi satıldı</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function RevenueRankedList({
  title,
  rows,
  currency,
  limit,
}: {
  title: string;
  rows: RevenueRow[];
  currency: string;
  limit?: number;
}) {
  const visible = limit ? rows.slice(0, limit) : rows;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((row, index) => (
          <li key={row.key} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex items-baseline gap-2">
                <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatMenuPrice(row.revenue, currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 pl-7">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.min(100, Math.max(0, row.share))}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {row.quantity.toLocaleString("tr-TR")} ad · %{row.share.toFixed(0)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RevenueTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: RevenueRow[];
  currency: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Ad</th>
              <th className="px-4 py-2 font-medium">Adet</th>
              <th className="px-4 py-2 font-medium">Ciro</th>
              <th className="px-4 py-2 font-medium">Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{row.quantity.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2 text-foreground">{formatMenuPrice(row.revenue, currency)}</td>
                <td className="px-4 py-2 text-muted-foreground">%{row.share.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { ArrowDown, Banknote, Trophy };
