"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { formatMenuPrice } from "@/components/menu-templates/types";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  cancelMerchantOrder,
  getMerchantOrder,
  OrderingApiError,
  type OrderResponse,
  type OrderStatus,
} from "@/lib/ordering-api";
import { cn } from "@/lib/utils";

type WaiterOrderDetailViewProps = {
  orderId: number;
};

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function orderCustomerName(order: OrderResponse): string {
  const name = order.customerName?.trim();
  if (name) return name;
  const waiter = order.waiterName?.trim();
  if (waiter) return waiter;
  return "Misafir";
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "CANCELLED":
      return "İptal edildi";
    case "REJECTED":
      return "Reddedildi";
    case "CONFIRMED":
      return "Alındı";
    case "SUBMITTED":
      return "Alındı";
    default:
      return String(status);
  }
}

function canCancelOrder(status: OrderStatus): boolean {
  return status === "CONFIRMED" || status === "SUBMITTED";
}

function amountNumber(value?: number | string | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function WaiterOrderDetailView({ orderId }: WaiterOrderDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { accessLoading: waiterAccessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { accessLoading: menuAccessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const accessLoading = waiterAccessLoading || menuAccessLoading;
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseWaiterPanel && canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;
  const qrId = selection?.qr.id ?? null;

  const orderQuery = useQuery({
    queryKey: ["menu-order", menuId, orderId],
    enabled: menuId != null,
    queryFn: () => getMerchantOrder(menuId!, orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelMerchantOrder(menuId!, orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["menu-orders", menuId] }),
        queryClient.invalidateQueries({ queryKey: ["menu-order", menuId, orderId] }),
      ]);
      notify("info", "Sipariş iptal edildi.");
      setCancelOpen(false);
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "İptal başarısız.");
    },
  });

  const backHref = useMemo(
    () => (qrId != null ? DASHBOARD_ROUTES.waiterForQr(qrId) : DASHBOARD_ROUTES.waiter),
    [qrId],
  );

  if (accessLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Sipariş Detayı" hint="Sipariş bilgileri" />
        <DashboardLoadingState label="Sipariş detayı hazırlanıyor..." />
      </div>
    );
  }

  const order = orderQuery.data;
  const currency = order?.currency || "TRY";
  const tip = amountNumber(order?.tipAmount);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <DashboardPageHeader
        title={order ? `Sipariş #${order.id}` : "Sipariş Detayı"}
        hint="Sipariş kalemleri ve tutar"
        action={
          <Link href={backHref} className={DASHBOARD_BACK} aria-label="Siparişlere dön">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <DashboardFilterBar>
        <DigitalMenuPicker
          menuQrs={menuQrs}
          selectedQrId={selection?.qr.id ?? null}
          onSelectQrId={(nextQrId) => {
            void selectQrId(nextQrId);
            router.replace(DASHBOARD_ROUTES.waiterOrderDetail(orderId, nextQrId), { scroll: false });
          }}
        />
      </DashboardFilterBar>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!menuId ? (
        <EmptyState
          title="Menü seçin"
          description="Sipariş detayını görmek için bir dijital menü seçin."
          action={
            <Button asChild variant="outline">
              <Link href={DASHBOARD_ROUTES.digitalMenu}>Menü & Şubeler</Link>
            </Button>
          }
        />
      ) : orderQuery.isLoading ? (
        <DashboardLoadingState label="Sipariş yükleniyor..." />
      ) : orderQuery.isError ? (
        <EmptyState
          title="Sipariş bulunamadı"
          description={
            orderQuery.error instanceof OrderingApiError
              ? orderQuery.error.message
              : "Bu sipariş görüntülenemedi."
          }
          action={
            <Button asChild variant="outline">
              <Link href={backHref}>Listeye dön</Link>
            </Button>
          }
        />
      ) : order ? (
        <div className="space-y-4">
          <div className={`${DASHBOARD_SURFACE} space-y-3 p-4 sm:p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{order.tableName || "Masa"}</h2>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      order.status === "CANCELLED"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {orderCustomerName(order)} · {formatWhen(order.submittedAt || order.createdAt)}
                </p>
                {order.waiterName ? (
                  <p className="text-xs text-muted-foreground">Garson: {order.waiterName}</p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-base font-semibold">
                  {formatMenuPrice(order.totalAmount ?? undefined, currency)}
                </p>
                {tip > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Bahşiş: {formatMenuPrice(tip, currency)}
                  </p>
                ) : null}
              </div>
            </div>

            <ul className="space-y-1.5 border-t border-border pt-3">
              {(order.items ?? []).map((item) => (
                <li key={`${order.id}-${item.id ?? item.productId}`} className="text-sm">
                  <span className="font-medium">{item.quantity}×</span>{" "}
                  {item.productName || `#${item.productId}`}
                  {item.selectedOptions?.length ? (
                    <span className="block text-xs text-muted-foreground">
                      {item.selectedOptions
                        .map((option) => option.optionName)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : null}
                  {item.note ? (
                    <span className="block text-xs text-muted-foreground">Not: {item.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>

            {order.note ? (
              <p className="rounded-md bg-muted/50 px-2 py-1.5 text-sm text-muted-foreground">
                Sipariş notu: {order.note}
              </p>
            ) : null}

            {order.waiterNote ? (
              <p className="rounded-md bg-muted/50 px-2 py-1.5 text-sm text-muted-foreground">
                Garson notu: {order.waiterNote}
              </p>
            ) : null}

            {canCancelOrder(order.status) ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-12 w-full text-base"
                disabled={cancelMutation.isPending}
                onClick={() => setCancelOpen(true)}
              >
                İptal et
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi iptal et?</AlertDialogTitle>
            <AlertDialogDescription>
              İptal edilen sipariş listede İptal edildi olarak görünür. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelMutation.mutate()}
            >
              İptal et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
