"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  getCustomerOrder,
  getCustomerOrders,
  type OrderResponse,
} from "@/lib/ordering-api";

import { MenuPriceText, useMenuPriceDisplay } from "./menu-currency";
import { Tx } from "@/components/google-translate-provider";

type OrderHistoryPanelProps = {
  menuId: number;
  onBack?: () => void;
};

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SUBMITTED":
      return "Gönderildi";
    case "CONFIRMED":
      return "Onaylandı";
    case "REJECTED":
      return "Reddedildi";
    default:
      return status;
  }
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderHistoryDetail({ order }: { order: OrderResponse }) {
  const currency = order.currency || "TRY";
  const totalLabel = useMenuPriceDisplay(order.totalAmount ?? undefined, currency);

  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Sipariş #{order.id}</p>
        <span className="text-xs text-muted-foreground">{statusLabel(order.status)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {order.tableName ? `${order.tableName} · ` : ""}
        {formatWhen(order.submittedAt || order.createdAt)}
      </p>
      <ul className="mt-3 space-y-2">
        {(order.items ?? []).map((item) => (
          <li key={`${item.productId}-${item.id ?? item.quantity}`} className="text-sm">
            <div className="flex justify-between gap-2">
              <span>
                {item.quantity}× <Tx>{item.productName || `#${item.productId}`}</Tx>
              </span>
              <span className="text-muted-foreground">
                <MenuPriceText price={item.lineTotal ?? item.unitPrice} currency={currency} />
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-border pt-2 text-sm font-medium">
        <span>Toplam</span>
        <span>{totalLabel}</span>
      </div>
      {order.note ? (
        <p className="mt-2 text-xs text-muted-foreground">Not: {order.note}</p>
      ) : null}
    </div>
  );
}

function OrderHistoryListItem({
  order,
  onOpen,
}: {
  order: OrderResponse;
  onOpen: (orderId: number) => void;
}) {
  const totalLabel = useMenuPriceDisplay(order.totalAmount ?? undefined, order.currency || "TRY");

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(order.id)}
        className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted/40"
      >
        <div>
          <p className="text-sm font-medium">#{order.id}</p>
          <p className="text-xs text-muted-foreground">
            {formatWhen(order.submittedAt || order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">{totalLabel}</p>
          <p className="text-xs text-muted-foreground">{statusLabel(order.status)}</p>
        </div>
      </button>
    </li>
  );
}

export function OrderHistoryPanel({ menuId, onBack }: OrderHistoryPanelProps) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selected, setSelected] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getCustomerOrders(menuId);
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Siparişler yüklenemedi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [menuId]);

  async function openDetail(orderId: number) {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await getCustomerOrder(orderId);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş detayı alınamadı");
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Listeye dön
        </button>
        <OrderHistoryDetail order={selected} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sipariş geçmişi</h3>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-xs text-muted-foreground underline">
            Geri
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {detailLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <OrderHistoryListItem key={order.id} order={order} onOpen={(id) => void openDetail(id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
