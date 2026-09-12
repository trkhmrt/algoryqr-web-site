import type { MenuRevenueReportResponse } from "@/lib/api";
import { revenueShare, toAmount } from "@/reporting/numbers";

export type CiroMetrics = {
  total: number;
  cash: number;
  card: number;
  tip: number;
  uber: number;
  net: number;
  items: number;
  orders: number;
  aov: number;
  currency: string;
  cashShare: number;
  cardShare: number;
  tipShare: number;
  inHouse: number;
  inHouseShare: number;
  paymentTotal: number;
};

export type ChannelMixRow = {
  code: string;
  label: string;
  revenue: number;
  orders: number;
  share: number;
  connected: boolean;
};

export type ChannelMix = {
  rows: ChannelMixRow[];
  total: number;
  leaderShare: number;
};

const CHANNEL_LABELS: Record<string, string> = {
  IN_HOUSE: "İç satış",
  UBER_EATS: "Uber Eats",
  YEMEK_SEPETI: "Yemeksepeti",
};

const CHANNEL_ORDER = ["IN_HOUSE", "UBER_EATS", "YEMEK_SEPETI"] as const;

export function readCiroMetrics(revenue: MenuRevenueReportResponse): CiroMetrics {
  const kpis = revenue.kpis ?? {};
  const pb = revenue.paymentBreakdown;
  const dailySum = (revenue.daily ?? []).reduce((sum, row) => sum + toAmount(row.revenue), 0);
  const hourlySum = (revenue.hourly ?? []).reduce((sum, row) => sum + toAmount(row.revenue), 0);
  const cash = toAmount(pb?.cashRevenue);
  const card = toAmount(pb?.cardRevenue);
  const tip = toAmount(pb?.tipRevenue);
  const uber = toAmount(pb?.uberEatsRevenue);
  const gross = toAmount(pb?.grossRevenue);
  const total = Math.max(toAmount(kpis.totalRevenue), gross, dailySum, hourlySum, cash + card + uber);
  const inHouse = cash + card;
  const paymentTotal = inHouse > 0 ? inHouse : total;
  const orders = kpis.orderCount ?? 0;
  const aov = toAmount(kpis.avgOrderValue) || (orders > 0 ? total / orders : 0);
  return {
    total,
    cash,
    card,
    tip,
    uber,
    net: toAmount(pb?.netRevenue) || total,
    items: kpis.itemCount ?? 0,
    orders,
    aov,
    currency: kpis.currency || pb?.currency || "TRY",
    cashShare: revenueShare(cash, paymentTotal),
    cardShare: revenueShare(card, paymentTotal),
    tipShare: revenueShare(tip, paymentTotal + tip),
    inHouse,
    inHouseShare: revenueShare(inHouse, total),
    paymentTotal,
  };
}

export function readChannelMix(
  revenue: MenuRevenueReportResponse,
  metrics: CiroMetrics,
): ChannelMix {
  const incoming = new Map((revenue.channels ?? []).map((row) => [row.code, row]));
  const extras = [...incoming.keys()].filter(
    (code) => !CHANNEL_ORDER.includes(code as (typeof CHANNEL_ORDER)[number]),
  );
  const rows = [...CHANNEL_ORDER, ...extras].map((code) => {
    const row = incoming.get(code);
    const fallback = channelFallback(code, metrics, row?.connected);
    const amount = row ? toAmount(row.revenue) : fallback.revenue;
    return {
      code,
      label: CHANNEL_LABELS[code] ?? row?.label ?? code,
      revenue: amount,
      orders: row?.orderCount ?? fallback.orders,
      share: 0,
      connected: row?.connected ?? fallback.connected,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.revenue, 0) || metrics.total;
  const withShare = rows.map((row) => ({
    ...row,
    share: revenueShare(row.revenue, total),
  }));
  return {
    rows: withShare,
    total,
    leaderShare: Math.max(...withShare.map((row) => row.share), 0),
  };
}

export type SoldRow = {
  name: string;
  quantity: number;
  revenue: number;
};

export type SoldMix = {
  products: SoldRow[];
  categories: SoldRow[];
  itemCount: number;
};

export function readSoldMix(revenue: MenuRevenueReportResponse): SoldMix {
  const products = [...(revenue.products ?? [])]
    .map((row) => ({
      name: row.name,
      quantity: row.quantity ?? 0,
      revenue: toAmount(row.revenue),
    }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  const categories = [...(revenue.categories ?? [])]
    .map((row) => ({
      name: row.name,
      quantity: row.quantity ?? 0,
      revenue: toAmount(row.revenue),
    }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  const fromProducts = products.reduce((sum, row) => sum + row.quantity, 0);
  const fromCategories = categories.reduce((sum, row) => sum + row.quantity, 0);
  const fromKpis = revenue.kpis?.itemCount ?? 0;
  return {
    products,
    categories,
    itemCount: Math.max(fromProducts, fromCategories, fromKpis),
  };
}

export type VolumeValueMix = {
  byQuantity: SoldRow[];
  byRevenue: SoldRow[];
  leastSold: SoldRow | null;
  unsoldCount: number;
};

export type ProfitMix = {
  gross: number;
  expense: number;
  net: number;
  netShare: number;
  expenseShare: number;
};

export function readVolumeValue(revenue: MenuRevenueReportResponse): VolumeValueMix {
  const sold = readSoldMix(revenue);
  const byRevenue = [...sold.products].sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);
  const least =
    revenue.spotlight?.leastSoldByQuantity != null
      ? {
          name: revenue.spotlight.leastSoldByQuantity.name,
          quantity: revenue.spotlight.leastSoldByQuantity.quantity ?? 0,
          revenue: toAmount(revenue.spotlight.leastSoldByQuantity.revenue),
        }
      : (sold.products[sold.products.length - 1] ?? null);
  return {
    byQuantity: sold.products.slice(0, 5),
    byRevenue: byRevenue.slice(0, 5),
    leastSold: least,
    unsoldCount: revenue.unsold?.count ?? revenue.unsold?.products?.length ?? 0,
  };
}

export function readProfitMix(revenue: MenuRevenueReportResponse, metrics: CiroMetrics): ProfitMix {
  const pb = revenue.paymentBreakdown;
  const gross = toAmount(pb?.grossRevenue) || metrics.total;
  const expense = toAmount(pb?.fixedExpenseTotal);
  const net = toAmount(pb?.netRevenue) || Math.max(0, gross - expense);
  return {
    gross,
    expense,
    net,
    netShare: revenueShare(net, gross),
    expenseShare: revenueShare(expense, gross),
  };
}

export type HourlyPoint = {
  hour: number;
  label: string;
  revenue: number;
};

function hourLabel(hour: number): string {
  return `${hour}:00`;
}

export function fillHourlyPoints(
  hourly: { hour: number; revenue?: number | string | null }[],
): HourlyPoint[] {
  const byHour = new Map<number, number>();
  for (const row of hourly) {
    byHour.set(row.hour, (byHour.get(row.hour) ?? 0) + toAmount(row.revenue));
  }
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: hourLabel(hour),
    revenue: byHour.get(hour) ?? 0,
  }));
}

function channelFallback(
  code: string,
  metrics: CiroMetrics,
  connected?: boolean,
): { revenue: number; orders: number; connected: boolean } {
  if (code === "IN_HOUSE") {
    return { revenue: metrics.inHouse, orders: metrics.orders, connected: true };
  }
  if (code === "UBER_EATS") {
    return { revenue: metrics.uber, orders: 0, connected: connected ?? metrics.uber > 0 };
  }
  return { revenue: 0, orders: 0, connected: connected ?? false };
}
