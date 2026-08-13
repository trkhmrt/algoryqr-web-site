"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { downloadQrImage, getQrDataUrl } from "@/components/dashboard/qr/qr-actions";
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
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  createMenuTable,
  listMenuTables,
  OrderingApiError,
  regenerateMenuTableQr,
  updateMenuTable,
  type RestaurantTable,
} from "@/lib/ordering-api";

function printQr(imgSrc?: string | null, title?: string) {
  const dataUrl = getQrDataUrl(imgSrc ?? undefined);
  if (!dataUrl) return false;
  const win = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><title>${title || "Masa QR"}</title>
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
img{max-width:90vw;max-height:70vh}p{text-align:center;margin-top:12px}</style></head>
<body><div><img src="${dataUrl}" alt="QR" /><p>${title || ""}</p></div>
<script>window.onload=()=>{window.print();}</script></body></html>`);
  win.document.close();
  return true;
}

export default function RestaurantLayoutView() {
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);

  const tablesQuery = useQuery({
    queryKey: ["menu-tables", menuId],
    enabled: menuId != null,
    queryFn: () => listMenuTables(menuId!),
  });

  const tables = tablesQuery.data ?? [];
  const selected = useMemo(
    () => tables.find((t) => t.id === selectedId) ?? tables[0] ?? null,
    [selectedId, tables],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createMenuTable(menuId!, {
        name: name.trim(),
        tableNumber: tableNumber.trim() ? Number(tableNumber) : undefined,
      }),
    onSuccess: async (table) => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      setName("");
      setTableNumber("");
      setSelectedId(table.id);
      notify("info", "Masa eklendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "Masa eklenemedi.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { tableId: number; active?: boolean; name?: string }) =>
      updateMenuTable(menuId!, payload.tableId, {
        active: payload.active,
        name: payload.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      notify("info", "Masa güncellendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "Güncelleme başarısız.");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (tableId: number) => regenerateMenuTableQr(menuId!, tableId),
    onSuccess: async (table: RestaurantTable) => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      setSelectedId(table.id);
      notify("info", "QR yenilendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "QR yenilenemedi.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.digitalMenu}>Dijital Menüye Dön</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Bu özellik için PRO paket gerekir.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={
            selection?.qr.id
              ? DASHBOARD_ROUTES.digitalMenuEdit(selection.qr.id)
              : DASHBOARD_ROUTES.digitalMenu
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Restoran Düzeni</h1>
          <p className="text-sm text-muted-foreground">Masa QR kodlarını yönetin.</p>
        </div>
      </div>

      <DigitalMenuPicker
        menuQrs={menuQrs}
        selectedQrId={selection?.qr.id ?? null}
        onSelectQrId={(qrId) => {
          void selectQrId(qrId);
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!menuId ? (
        <p className="text-sm text-muted-foreground">Menü seçin.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Seçili masa QR</p>
            {selected?.qrImageBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getQrDataUrl(selected.qrImageBase64) ?? undefined}
                alt={selected.name}
                className="mx-auto w-full max-w-[220px] rounded-lg border border-border bg-white p-2"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                {tablesQuery.isLoading ? "Yükleniyor…" : "Masa seçin"}
              </div>
            )}
            {selected ? (
              <div className="space-y-2">
                <p className="text-center text-sm font-medium">
                  {selected.name}
                  {selected.tableNumber != null ? ` · #${selected.tableNumber}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selected.qrImageBase64}
                    onClick={() =>
                      downloadQrImage(selected.qrImageBase64!, `masa-${selected.name}`)
                    }
                  >
                    İndir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selected.qrImageBase64}
                    onClick={() => printQr(selected.qrImageBase64, selected.name)}
                  >
                    Yazdır
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={regenerateMutation.isPending}
                  onClick={() => setRegenerateConfirmOpen(true)}
                >
                  {regenerateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  QR Yenile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      tableId: selected.id,
                      active: !selected.active,
                    })
                  }
                >
                  {selected.active ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                createMutation.mutate();
              }}
            >
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Masa adı</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Örn. Bahçe 1"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-muted-foreground">No</label>
                <input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  type="number"
                  placeholder="12"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle"}
              </Button>
            </form>

            {tablesQuery.isLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz masa yok. Yukarıdan ekleyin.</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {tables.map((table) => {
                  const active = (selected?.id ?? null) === table.id;
                  return (
                    <li key={table.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(table.id)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                          active ? "bg-muted/60" : "hover:bg-muted/40"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{table.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.tableNumber != null ? `No ${table.tableNumber} · ` : ""}
                            {table.active ? "Aktif" : "Pasif"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">Seç</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={regenerateConfirmOpen} onOpenChange={setRegenerateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR kodunu yenile?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu masanın QR kodu değişecek. Eski QR artık geçersiz olacak; basılı/yerleştirilmiş
              kodlar çalışmayı durdurur. Yeni QR&apos;ı yeniden indirip yazdırmanız gerekir.
              {selected ? (
                <span className="mt-2 block font-medium text-foreground">
                  Masa: {selected.name}
                  {selected.tableNumber != null ? ` (#${selected.tableNumber})` : ""}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerateMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={regenerateMutation.isPending || !selected}
              onClick={(e) => {
                e.preventDefault();
                if (!selected) return;
                regenerateMutation.mutate(selected.id, {
                  onSettled: () => setRegenerateConfirmOpen(false),
                });
              }}
            >
              {regenerateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Evet, yenile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
