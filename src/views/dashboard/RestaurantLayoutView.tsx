"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  Power,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
import { DASHBOARD_BACK } from "@/lib/dashboard-surface";
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
    <div className="mx-auto w-full max-w-3xl space-y-4 animate-fade-in">
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
        <div className="space-y-3">
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createMutation.mutate();
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Masa adı"
              aria-label="Masa adı"
              className="min-w-[120px] flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
            />
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              type="number"
              placeholder="No"
              aria-label="Masa numarası"
              className="w-16 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
            />
            <Button type="submit" size="sm" className="h-8" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle"}
            </Button>
          </form>

          {tablesQuery.isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz masa yok. Yukarıdan ekleyin.</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {tables.map((table) => {
                const active = (selected?.id ?? null) === table.id;
                const editing = isEditing && active;
                return (
                  <li key={table.id}>
                    {editing ? (
                      <div className="flex flex-wrap items-center gap-2 bg-muted/50 px-2.5 py-2">
                        {table.qrImageBase64 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getQrDataUrl(table.qrImageBase64) ?? undefined}
                            alt=""
                            className="h-7 w-7 shrink-0 rounded border border-border bg-white p-0.5"
                          />
                        ) : null}
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          aria-label="Masa adı"
                          className="min-w-[100px] flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                        <input
                          value={editTableNumber}
                          onChange={(e) => setEditTableNumber(e.target.value)}
                          type="number"
                          aria-label="Masa numarası"
                          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7"
                          disabled={updateMutation.isPending || !editName.trim()}
                          onClick={saveEditing}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Kaydet"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          disabled={updateMutation.isPending}
                          onClick={cancelEditing}
                        >
                          Vazgeç
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`flex w-full items-center gap-1.5 px-2.5 py-1.5 transition-colors ${
                          active ? "bg-muted/50" : "hover:bg-muted/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(table.id);
                            cancelEditing();
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                        >
                          {table.qrImageBase64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getQrDataUrl(table.qrImageBase64) ?? undefined}
                              alt=""
                              className="h-7 w-7 shrink-0 rounded border border-border bg-white p-0.5"
                            />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-dashed border-border text-[9px] text-muted-foreground">
                              —
                            </span>
                          )}
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{table.name}</span>
                            <span className="text-muted-foreground">
                              {table.tableNumber != null ? ` · ${table.tableNumber}` : ""}
                              {table.active ? "" : " · Pasif"}
                            </span>
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`${table.name} indir`}
                            disabled={!table.qrImageBase64}
                            onClick={() => {
                              setSelectedId(table.id);
                              downloadQrImage(table.qrImageBase64!, `masa-${table.name}`);
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`${table.name} yazdır`}
                            disabled={!table.qrImageBase64}
                            onClick={() => {
                              setSelectedId(table.id);
                              printQr(table.qrImageBase64, table.name);
                            }}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`${table.name} QR yenile`}
                            disabled={regenerateMutation.isPending}
                            onClick={() => {
                              setSelectedId(table.id);
                              setRegenerateConfirmOpen(true);
                            }}
                          >
                            {regenerateMutation.isPending && selected?.id === table.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={table.active ? "Pasifleştir" : "Aktifleştir"}
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              setSelectedId(table.id);
                              updateMutation.mutate({
                                tableId: table.id,
                                active: !table.active,
                              });
                            }}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`${table.name} düzenle`}
                            onClick={() => startEditing(table)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            aria-label={`${table.name} sil`}
                            onClick={() => openDeleteConfirm(table)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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
