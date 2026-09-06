"use client";

import { useQuery } from "@tanstack/react-query";

import { useDigitalMenuSelection } from "@/components/dashboard/menu/DigitalMenuPicker";
import { listMerchantOrders } from "@/lib/ordering-api";

export function usePendingOrderCount(enabled: boolean) {
  const { selection, loading: selectionLoading } = useDigitalMenuSelection(null, enabled);
  const menuId = selection?.menu.menuId ?? null;

  const ordersQuery = useQuery({
    queryKey: ["menu-orders-active-count", menuId],
    queryFn: () => listMerchantOrders(menuId!, "ALL"),
    enabled: enabled && menuId != null,
    refetchInterval: 30_000,
    staleTime: 15_000,
    select: (orders) =>
      orders.filter((order) => order.status === "CONFIRMED" || order.status === "SUBMITTED")
        .length,
  });

  return {
    count: ordersQuery.data ?? 0,
    loading: selectionLoading || ordersQuery.isLoading,
  };
}
