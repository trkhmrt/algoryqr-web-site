"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  Banknote,
  CreditCard,
  Coins,
  PackageX,
  Receipt,
  ShoppingBag,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMenuPrice } from "@/components/menu-templates/types";
import type { MenuRevenueReportResponse } from "@/lib/api";
import {
  buildRevenueReportView,
  type RevenueKpiId,
  type SpotlightCard,
  type UnsoldSpotlightCard,
} from "@/reporting";

const c = (token: string) => `hsl(var(--chart-${token}))`;

const COLORS = {
  green: c("green"),
  indigo: c("indigo"),
  teal: c("teal"),
  violet: c("violet"),
  orange: c("orange"),
  red: c("red"),
};

const PIE_FILLS = [COLORS.indigo, COLORS.teal, COLORS.green, COLORS.violet, COLORS.orange];

const KPI_ICONS: Record<RevenueKpiId, LucideIcon> = {
  totalRevenue: Banknote,
  confirmedOrderCount: Receipt,
  soldItemCount: ShoppingBag,
  averageBasket: Wallet,
};

const KPI_COLORS: Record<RevenueKpiId, string> = {
  totalRevenue: COLORS.green,
  confirmedOrderCount: COLORS.indigo,
  soldItemCount: COLORS.teal,
  averageBasket: COLORS.orange,
};

export default function AnalyticsRevenuePanel({
  report,
  tooltipStyle,
}: {
  report: MenuRevenueReportResponse;
  tooltipStyle: Record<string, string>;
}) {
  const view = buildRevenueReportView(report);
  const { currency, empty, daily, products, productsByQuantityAsc, categories, spotlight, hourly } = view;
  const breakdown = report.paymentBreakdown;
  const personnel = report.personnel ?? [];
  const breakdownCurrency = breakdown?.currency || currency;
  const kpis = view.kpis.map((m) => ({
    ...m,
    icon: KPI_ICONS[m.id],
    color: KPI_COLORS[m.id],
    display: m.unit === "money" ? formatMenuPrice(m.value, currency) : m.display,
  }));

  if (empty) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6 text-sm text-muted-foreground">
        Seçilen dönemde tahsilat kaydı yok. Adisyon ödemeleri alındıkça ciro burada görünür.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card"
          >
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <m.icon className="h-4 w-4 shrink-0" style={{ color: m.color }} />
                <p className="text-sm font-semibold leading-tight text-foreground">{m.label}</p>
              </div>
              <p className="text-lg font-semibold tracking-tight text-foreground">{m.display}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {breakdown ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Nakit", value: breakdown.cashRevenue, icon: Banknote, color: COLORS.green },
            { label: "Kart", value: breakdown.cardRevenue, icon: CreditCard, color: COLORS.indigo },
            { label: "Bahşiş", value: breakdown.tipRevenue, icon: Coins, color: COLORS.orange },
            { label: "Brüt ciro", value: breakdown.grossRevenue, icon: Wallet, color: COLORS.teal },
            {
              label: "Sabit gider (düşüldü)",
              value: breakdown.fixedExpenseTotal,
              icon: Receipt,
              color: COLORS.red,
            },
            { label: "Net ciro", value: breakdown.netRevenue, icon: Trophy, color: COLORS.violet },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" style={{ color: item.color }} />
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              </div>
              <p className="mt-2 text-base font-semibold tabular-nums">
                {formatMenuPrice(item.value ?? 0, breakdownCurrency)}
              </p>
            </motion.div>
          ))}
        </div>
      ) : null}

      {personnel.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Personel cirosu</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Personel</th>
                  <th className="px-4 py-2 font-medium">Toplam</th>
                  <th className="px-4 py-2 font-medium">Nakit</th>
                  <th className="px-4 py-2 font-medium">Kart</th>
                  <th className="px-4 py-2 font-medium">Bahşiş</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map((row) => (
                  <tr key={row.waiterId ?? row.displayName} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">
                      {row.displayName}
                      {row.active === false ? (
                        <span className="ml-2 text-xs text-muted-foreground">(pasif)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatMenuPrice(row.revenue ?? 0, breakdownCurrency)}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {formatMenuPrice(row.cashRevenue ?? 0, breakdownCurrency)}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {formatMenuPrice(row.cardRevenue ?? 0, breakdownCurrency)}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {formatMenuPrice(row.tipRevenue ?? 0, breakdownCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightProductCard
          card={spotlight.byQuantity}
          icon={Trophy}
          color={COLORS.violet}
          metric={
            spotlight.byQuantity.product
              ? `${spotlight.byQuantity.product.quantity.toLocaleString("tr-TR")} adet`
              : undefined
          }
        />
        <SpotlightProductCard
          card={spotlight.byRevenue}
          icon={Banknote}
          color={COLORS.green}
          metric={
            spotlight.byRevenue.product
              ? formatMenuPrice(spotlight.byRevenue.product.revenue, currency)
              : undefined
          }
        />
        <SpotlightProductCard
          card={spotlight.leastSold}
          icon={ArrowDown}
          color={COLORS.orange}
          metric={
            spotlight.leastSold.product
              ? `${spotlight.leastSold.product.quantity.toLocaleString("tr-TR")} adet`
              : undefined
          }
        />
        <UnsoldCard card={spotlight.unsold} />
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Saatlik yoğunluk</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="hour" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "Ciro"
                    ? formatMenuPrice(Number(value), currency)
                    : Number(value).toLocaleString("tr-TR")
                }
              />
              <Legend />
              <Bar dataKey="orderCount" name="Sipariş" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Ciro" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Günlük ciro</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="dateLabel" stroke="hsl(0 0% 40%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(0 0% 40%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "Ciro"
                    ? formatMenuPrice(Number(value), currency)
                    : Number(value).toLocaleString("tr-TR")
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Ciro"
                stroke={COLORS.green}
                strokeWidth={2}
                fill="url(#gradRevenue)"
              />
              <Area
                type="monotone"
                dataKey="orderCount"
                name="Sipariş"
                stroke={COLORS.indigo}
                strokeWidth={1.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Kategori cirosu</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categories.map((row, i) => (
                    <Cell key={row.key} fill={PIE_FILLS[i % PIE_FILLS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatMenuPrice(Number(value), currency)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Ürün cirosu</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis type="number" stroke="hsl(0 0% 40%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  stroke="hsl(0 0% 40%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatMenuPrice(Number(value), currency)}
                />
                <Bar dataKey="revenue" name="Ciro" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTable title="Ürün bazlı satış (ciro)" rows={products} currency={currency} />
        <RevenueTable title="En az satan ürünler (adet)" rows={productsByQuantityAsc} currency={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTable title="Kategori bazlı satış" rows={categories} currency={currency} />
      </div>
    </>
  );
}

function SpotlightProductCard({
  card,
  icon: Icon,
  color,
  metric,
}: {
  card: SpotlightCard;
  icon: LucideIcon;
  color: string;
  metric?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <p className="text-sm font-semibold leading-tight text-foreground">{card.label}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-foreground">{card.display}</p>
          {metric ? <p className="mt-0.5 text-xs text-muted-foreground">{metric}</p> : null}
        </div>
      </div>
    </motion.div>
  );
}

function UnsoldCard({ card }: { card: UnsoldSpotlightCard }) {
  const preview = card.products.slice(0, 3).map((row) => row.name).join(", ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#e5e7eb] bg-white text-card-foreground shadow-none dark:border-border dark:bg-card"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4 shrink-0" style={{ color: COLORS.red }} />
          <p className="text-sm font-semibold leading-tight text-foreground">{card.label}</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-foreground">{card.display}</p>
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

function RevenueTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { key: string; name: string; quantity: number; revenue: number; share: number }[];
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
