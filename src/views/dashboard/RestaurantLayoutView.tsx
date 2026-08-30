"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
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
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";
import {
  createMenuTable,
  deleteMenuTable,
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

  const { accessLoading: waiterAccessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { accessLoading: menuAccessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const accessLoading = waiterAccessLoading || menuAccessLoading;
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseWaiterPanel && canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTable | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTableNumber, setEditTableNumber] = useState("");

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
    mutationFn: (payload: {
      tableId: number;
      active?: boolean;
      name?: string;
      tableNumber?: number | null;
    }) =>
      updateMenuTable(menuId!, payload.tableId, {
        active: payload.active,
        name: payload.name,
        tableNumber: payload.tableNumber,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      setIsEditing(false);
      notify("info", "Masa güncellendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "Güncelleme başarısız.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tableId: number) => deleteMenuTable(menuId!, tableId),
    onSuccess: async (_data, tableId) => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      if (selectedId === tableId) {
        setSelectedId(null);
      }
      setDeleteTarget(null);
      setDeleteConfirmOpen(false);
      notify("info", "Masa silindi.");
    },
    onError: (err) => {
      notify("danger", err instanceof OrderingApiError ? err.message : "Masa silinemedi.");
    },
  });

  const startEditing = (table: RestaurantTable) => {
    setSelectedId(table.id);
    setEditName(table.name);
    setEditTableNumber(table.tableNumber != null ? String(table.tableNumber) : "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
    setEditTableNumber("");
  };

  const saveEditing = () => {
    if (!selected || !editName.trim()) return;
    updateMutation.mutate({
      tableId: selected.id,
      name: editName.trim(),
      tableNumber: editTableNumber.trim() ? Number(editTableNumber) : null,
    });
  };

  const openDeleteConfirm = (table: RestaurantTable) => {
    setDeleteTarget(table);
    setDeleteConfirmOpen(true);
  };

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
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Restoran Düzeni" hint="Masa QR kodlarını yönetin." />
        <DashboardLoadingState label="Restoran düzeni yükleniyor…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Restoran Düzeni"
        hint="Masa QR kodlarını yönetin."
        back={
          <Link
            href={
              selection?.qr.id
                ? DASHBOARD_ROUTES.digitalMenuEdit(selection.qr.id)
                : DASHBOARD_ROUTES.digitalMenu
            }
            aria-label="Menü düzenleyiciye dön"
            className={DASHBOARD_BACK}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

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
          <div className={`${DASHBOARD_PANEL} space-y-3`}>
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
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Masa adı</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">No</label>
                      <input
                        value={editTableNumber}
                        onChange={(e) => setEditTableNumber(e.target.value)}
                        type="number"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateMutation.isPending || !editName.trim()}
                        onClick={saveEditing}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Kaydet"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={cancelEditing}
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-center text-sm font-medium">
                      {selected.name}
                      {selected.tableNumber != null ? ` · #${selected.tableNumber}` : ""}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => startEditing(selected)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </Button>
                  </>
                )}
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
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => openDeleteConfirm(selected)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
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
                      <div
                        className={`flex w-full items-center gap-2 px-3 py-2.5 transition-colors ${
                          active ? "bg-muted/60" : "hover:bg-muted/40"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(table.id);
                            cancelEditing();
                          }}
                          className="min-w-0 flex-1 text-left text-sm"
                        >
                          <p className="font-medium">{table.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.tableNumber != null ? `No ${table.tableNumber} · ` : ""}
                            {table.active ? "Aktif" : "Pasif"}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`${table.name} düzenle`}
                            onClick={() => startEditing(table)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`${table.name} sil`}
                            onClick={() => openDeleteConfirm(table)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
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

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masa silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu masa restoran düzeninden kaldırılacak ve QR kodu artık kullanılamayacak.
              {deleteTarget ? (
                <span className="mt-2 block font-medium text-foreground">
                  Masa: {deleteTarget.name}
                  {deleteTarget.tableNumber != null ? ` (#${deleteTarget.tableNumber})` : ""}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending || !deleteTarget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Evet, sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
