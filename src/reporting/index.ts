export type { AnalyticsPeriod, ReportingKpiCard, ReportingMethodDef } from "./types";
export { reportingPeriodRange, formatReportingDate } from "./period";
export { toAmount, roundMoney, revenueShare, roundedSharePercent } from "./numbers";

export {
  HOURLY_REVENUE_METHODS,
  REVENUE_METHODS,
  SPOTLIGHT_METHODS,
  averageBasket,
  confirmedOrderCount,
  dailyOrderCount,
  dailyRevenue,
  hourlyOrderCount,
  hourlyRevenue,
  isRevenueReportEmpty,
  isSingleDayRange,
  leastSoldByQuantity,
  lineQuantity,
  lineRevenue,
  lineRevenueShare,
  periodStarByQuantity,
  periodStarByRevenue,
  periodStarQuantityLabel,
  soldItemCount,
  totalRevenue,
  unsoldCatalogCount,
} from "./revenue/methods";
export type { HourlyRevenueMethodId, RevenueKpiId, SpotlightMethodId } from "./revenue/methods";
export { buildRevenueReportView } from "./revenue/view-model";
export type {
  HourlyRevenuePoint,
  RevenueBreakdownRow,
  RevenueChartPoint,
  RevenueReportView,
  SpotlightCard,
  SpotlightProduct,
  UnsoldSpotlightCard,
} from "./revenue/view-model";

export {
  VISIT_METHODS,
  averageProductsPerSession,
  categoryViewCount,
  deviceSharePercent,
  formatAverageProductsPerSession,
  hourlyEventCount,
  isVisitReportEmpty,
  menuOpenCount,
  productViewCount,
  sessionCount,
} from "./visits/methods";
export type { VisitKpiId } from "./visits/methods";
export { buildVisitReportView } from "./visits/view-model";
export type { VisitReportView } from "./visits/view-model";

export {
  WAITER_PERFORMANCE_METHODS,
  activeWaiterCount,
  assignedOrderCount,
  isWaiterPerformanceReportEmpty,
  isWaiterRowEmpty,
  unassignedOrderCount,
  waiterPerformanceAverageBasket,
  waiterPerformanceBillsClosedCount,
  waiterPerformanceCommission,
  waiterPerformanceItemCount,
  waiterPerformanceOrderCount,
  waiterPerformanceRevenue,
  waiterPerformanceSoldItemCount,
  waiterPerformanceTotalCommission,
  waiterPerformanceTotalRevenue,
  waiterPerformanceTotalTip,
} from "./waiter/methods";
export type { WaiterPerformanceKpiId } from "./waiter/methods";
export {
  WAITER_FILTER_ALL,
  buildWaiterPerformanceReportView,
  filterWaiterPerformanceReportView,
} from "./waiter/view-model";
export type {
  WaiterDailyChartPoint,
  WaiterHourlyChartPoint,
  WaiterPerformanceChartPoint,
  WaiterPerformanceReportView,
  WaiterPerformanceRowView,
  WaiterProductRowView,
} from "./waiter/view-model";
