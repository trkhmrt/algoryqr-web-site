"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useBranches } from "@/hooks/use-branches";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  acceptTrendyolGoOrder,
  cancelTrendyolGoOrder,
  listTrendyolGoOrders,
  readyTrendyolGoOrder,
  rejectTrendyolGoOrder,
  type TrendyolGoOrder,
} from "@/lib/trendyol-go-api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrendyolGoOrdersView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu && !accessLoading);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(null);
  const selectedBranchId = branchId ?? branches[0]?.id ?? null;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["tgo-orders", selectedBranchId, status, page],
    queryFn: () => listTrendyolGoOrders(selectedBranchId as number, status, page),
    enabled: selectedBranchId != null && canUseDigitalMenu,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: number; action: "accept" | "reject" | "cancel" | "ready" }) => {
      const id = selectedBranchId as number;
      if (action === "accept") return acceptTrendyolGoOrder(id, orderId);
      if (action === "reject") return rejectTrendyolGoOrder(id, orderId);
      if (action === "cancel") return cancelTrendyolGoOrder(id, orderId);
      return readyTrendyolGoOrder(id, orderId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tgo-orders"] });
      notify("info", "Sipariş güncellendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Sipariş güncellenemedi.");
    },
  });

  const orders = ordersQuery.data?.content ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TGO Siparişler</h1>
          <p className="text-sm text-muted-foreground">Uber Eats Trendyol Go Yemek sipariş takibi</p>
        </div>
        <Button asChild variant="outline">
          <Link href={DASHBOARD_ROUTES.trendyolGo}>Bağlantı</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selectedBranchId ?? ""}
          onChange={(event) => {
            setBranchId(Number(event.target.value));
            setPage(0);
          }}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
        >
          <option value="">Tüm durumlar</option>
          <option value="Created">Yeni</option>
          <option value="Accepted">Kabul</option>
          <option value="Prepared">Hazır</option>
          <option value="Rejected">Red</option>
          <option value="Cancelled">İptal</option>
        </select>
      </div>

      {ordersQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : ordersQuery.isError ? (
        <p className="text-sm text-destructive">Siparişler alınamadı. Önce restoran bağlayın.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              open={openId === order.id}
              onToggle={() => setOpenId((current) => (current === order.id ? null : order.id))}
              busy={actionMutation.isPending}
              onAction={(action) => actionMutation.mutate({ orderId: order.id, action })}
            />
          ))}
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">Sipariş yok.</p> : null}
          {(ordersQuery.data?.totalPages ?? 0) > 1 ? (
            <div className="flex justify-between">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                Önceki
              </Button>
              <Button
                variant="outline"
                disabled={page + 1 >= (ordersQuery.data?.totalPages ?? 0)}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sonraki
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  open,
  onToggle,
  busy,
  onAction,
}: {
  order: TrendyolGoOrder;
  open: boolean;
  onToggle: () => void;
  busy: boolean;
  onAction: (action: "accept" | "reject" | "cancel" | "ready") => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <button type="button" className="flex w-full items-start justify-between text-left" onClick={onToggle}>
          <div>
            <p className="font-medium">#{order.externalOrderId}</p>
            <p className="text-xs text-muted-foreground">
              {order.packageStatus || "—"} · {formatDate(order.packageCreatedAt)}
            </p>
            <p className="text-sm">{order.customerName || "Müşteri"}</p>
          </div>
          <p className="text-sm font-semibold">
            {order.totalAmount != null ? `${order.totalAmount} ${order.currency || "TRY"}` : "—"}
          </p>
        </button>
        {open ? (
          <div className="space-y-2 text-sm">
            {order.customerPhone ? <p>Tel: {order.customerPhone}</p> : null}
            {order.deliveryAddress ? <p>{order.deliveryAddress}</p> : null}
            {order.note ? <p className="text-muted-foreground">Not: {order.note}</p> : null}
            <ul className="space-y-1">
              {order.items.map((item, index) => (
                <li key={`${item.productId ?? index}`}>
                  {item.quantity}× {item.productName || item.productId}
                  {item.options ? ` (${item.options})` : ""}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" disabled={busy} onClick={() => onAction("accept")}>
                Kabul
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("ready")}>
                Hazır
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("reject")}>
                Red
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("cancel")}>
                İptal
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
