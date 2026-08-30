"use client";

import { useQuery } from "@tanstack/react-query";

import { useDigitalMenuSelection } from "@/components/dashboard/menu/DigitalMenuPicker";
import { useBranches } from "@/hooks/use-branches";
import { usePendingOrderCount } from "@/hooks/use-pending-order-count";
import { getMenuReservationsRequest } from "@/lib/api";
import { flattenBranchMenus } from "@/lib/digital-menu-directory";
import { todayDateRange } from "@/components/ui/date-range-filter";

export function useOverviewOpsStats(options: {
  orders: boolean;
  reservations: boolean;
  menus: boolean;
}) {
  const pending = usePendingOrderCount(options.orders);
  const { selection, loading: selectionLoading } = useDigitalMenuSelection(
    null,
    options.reservations,
  );
  const menuId = selection?.menu.menuId ?? null;
  const today = todayDateRange();

  const reservationsQuery = useQuery({
    queryKey: ["overview-reservations-today", menuId, today.from, today.to],
    enabled: options.reservations && menuId != null,
    queryFn: () =>
      getMenuReservationsRequest(menuId!, {
        from: today.from,
        to: today.to,
        size: 1,
      }),
    select: (page) => page.totalElements,
  });

  const branchesQuery = useBranches(options.menus);
  const menus = flattenBranchMenus(branchesQuery.data?.content ?? []);
  const liveMenus = menus.filter((menu) => menu.active).length;

  return {
    pendingOrders: pending.count,
    reservationsToday: reservationsQuery.data ?? 0,
    liveMenus,
    totalMenus: menus.length,
    branchCount: branchesQuery.data?.content.length ?? 0,
    loading:
      pending.loading ||
      (options.reservations && (selectionLoading || reservationsQuery.isLoading)) ||
      (options.menus && branchesQuery.isLoading),
  };
}
