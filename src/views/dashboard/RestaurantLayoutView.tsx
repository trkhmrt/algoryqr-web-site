"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type TableFilter = "active" | "passive";

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
  const [tableFilter, setTableFilter] = useState<TableFilter>("active");

  const tablesQuery = useQuery({
    queryKey: ["menu-tables", menuId],
    enabled: menuId != null,
    queryFn: () => listMenuTables(menuId!),
  });

  const tables = tablesQuery.data ?? [];
  const activeTables = useMemo(() => tables.filter((t) => t.active), [tables]);
  const passiveTables = useMemo(() => tables.filter((t) => !t.active), [tables]);
  const visibleTables = tableFilter === "active" ? activeTables : passiveTables;

  const selected = useMemo(
    () => tables.find((t) => t.id === selectedId) ?? visibleTables[0] ?? null,
    [selectedId, tables, visibleTables],
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
      setTableFilter("active");
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
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["menu-tables", menuId] });
      setIsEditing(false);
      if (typeof variables.active === "boolean") {
        setTableFilter(variables.active ? "active" : "passive");
        notify("info", variables.active ? "Masa aktifleştirildi." : "Masa pasifleştirildi.");
        return;
      }
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

  const toggleActive = (table: RestaurantTable) => {
    setSelectedId(table.id);
    updateMutation.mutate({
      tableId: table.id,
      active: !table.active,
    });
  };

  type RowAction = {
    key: string;
    label: string;
    icon: ReactNode;
    disabled?: boolean;
    destructive?: boolean;
    onClick: () => void;
  };

  const getRowActions = (table: RestaurantTable): RowAction[] => [
    {
      key: "download",
      label: `${table.name} indir`,
      icon: <Download className="h-4 w-4" />,
      disabled: !table.qrImageBase64,
      onClick: () => {
        setSelectedId(table.id);
        downloadQrImage(table.qrImageBase64!, `masa-${table.name}`);
      },
    },
    {
      key: "print",
      label: `${table.name} yazdır`,
      icon: <Printer className="h-4 w-4" />,
      disabled: !table.qrImageBase64,
      onClick: () => {
        setSelectedId(table.id);
        printQr(table.qrImageBase64, table.name);
      },
    },
    {
      key: "regenerate",
      label: `${table.name} QR yenile`,
      icon:
        regenerateMutation.isPending && selected?.id === table.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        ),
      disabled: regenerateMutation.isPending,
      onClick: () => {
        setSelectedId(table.id);
        setRegenerateConfirmOpen(true);
      },
    },
    {
      key: "edit",
      label: `${table.name} düzenle`,
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => startEditing(table),
    },
    {
      key: "delete",
      label: `${table.name} sil`,
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      onClick: () => openDeleteConfirm(table),
    },
  ];

  if (accessLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Restoran Düzeni" hint="Masa QR kodlarını yönetin." />
        <DashboardLoadingState label="Restoran düzeni yükleniyor…" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
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
            <Tabs
              value={tableFilter}
              onValueChange={(value) => {
                setTableFilter(value as TableFilter);
                cancelEditing();
              }}
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="active">Aktif ({activeTables.length})</TabsTrigger>
                <TabsTrigger value="passive">Pasif ({passiveTables.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={tableFilter} className="mt-3">
                {visibleTables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tableFilter === "active"
                      ? "Aktif masa yok."
                      : "Pasif masa yok."}
                  </p>
                ) : (
                  <>
                    {/* Mobile: card list (avoids horizontal scroll, larger touch targets) */}
                    <div className="space-y-2 sm:hidden">
                      {visibleTables.map((table) => {
                        const active = (selected?.id ?? null) === table.id;
                        const editing = isEditing && active;
                        return (
                          <div
                            key={table.id}
                            className={`rounded-lg border bg-white p-3 ${
                              active ? "border-gray-300" : "border-gray-200"
                            }`}
                            onClick={() => {
                              if (!editing) {
                                setSelectedId(table.id);
                                cancelEditing();
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {table.qrImageBase64 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getQrDataUrl(table.qrImageBase64) ?? undefined}
                                  alt=""
                                  className="h-12 w-12 shrink-0 rounded border border-gray-200 bg-white p-0.5"
                                />
                              ) : (
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-dashed border-gray-200 text-[10px] text-gray-400">
                                  —
                                </span>
                              )}

                              <div className="min-w-0 flex-1">
                                {editing ? (
                                  <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      required
                                      aria-label="Masa adı"
                                      className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
                                    />
                                    <input
                                      value={editTableNumber}
                                      onChange={(e) => setEditTableNumber(e.target.value)}
                                      type="number"
                                      placeholder="No"
                                      aria-label="Masa numarası"
                                      className="w-16 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                                    <span className="font-medium">{table.name}</span>
                                    {table.tableNumber != null ? (
                                      <span className="text-sm text-gray-500">
                                        #{table.tableNumber}
                                      </span>
                                    ) : null}
                                  </div>
                                )}

                                <div
                                  className="mt-1.5 flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Switch
                                    checked={table.active}
                                    disabled={updateMutation.isPending}
                                    onCheckedChange={() => toggleActive(table)}
                                    aria-label={
                                      table.active
                                        ? `${table.name} pasifleştir`
                                        : `${table.name} aktifleştir`
                                    }
                                  />
                                  <span className="text-xs text-gray-500">
                                    {table.active ? "Aktif" : "Pasif"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {editing ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-9 flex-1"
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
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 flex-1"
                                    disabled={updateMutation.isPending}
                                    onClick={cancelEditing}
                                  >
                                    Vazgeç
                                  </Button>
                                </>
                              ) : (
                                <div className="flex flex-1 items-center justify-between">
                                  {getRowActions(table).map((action) => (
                                    <Button
                                      key={action.key}
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={`h-10 w-10 ${
                                        action.destructive
                                          ? "text-destructive hover:text-destructive"
                                          : ""
                                      }`}
                                      aria-label={action.label}
                                      disabled={action.disabled}
                                      onClick={action.onClick}
                                    >
                                      {action.icon}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tablet & up: full grid table */}
                    <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
                      <table className="w-full min-w-[820px] border-collapse bg-white text-sm">
                      <thead className="border-b border-gray-200 bg-white text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 font-medium">QR</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium">Masa</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium">No</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium">Durum</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium text-center">İndir</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium text-center">Yazdır</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium text-center">Yenile</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium text-center">Düzenle</th>
                          <th className="border border-gray-200 px-3 py-2 font-medium text-center">Sil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {visibleTables.map((table) => {
                          const active = (selected?.id ?? null) === table.id;
                          const editing = isEditing && active;
                          return (
                            <tr
                              key={table.id}
                              className={active ? "bg-gray-50" : "bg-white hover:bg-gray-50/60"}
                              onClick={() => {
                                if (!editing) {
                                  setSelectedId(table.id);
                                  cancelEditing();
                                }
                              }}
                            >
                              <td className="border border-gray-200 px-3 py-2">
                                {table.qrImageBase64 ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getQrDataUrl(table.qrImageBase64) ?? undefined}
                                    alt=""
                                    className="h-8 w-8 rounded border border-border bg-white p-0.5"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-border text-[9px] text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {editing ? (
                                  <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    aria-label="Masa adı"
                                    className="w-full min-w-[120px] rounded-md border border-border bg-background px-2 py-1 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="font-medium">{table.name}</span>
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-gray-500">
                                {editing ? (
                                  <input
                                    value={editTableNumber}
                                    onChange={(e) => setEditTableNumber(e.target.value)}
                                    type="number"
                                    aria-label="Masa numarası"
                                    className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  table.tableNumber ?? "—"
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={table.active}
                                    disabled={updateMutation.isPending}
                                    onCheckedChange={() => toggleActive(table)}
                                    aria-label={
                                      table.active
                                        ? `${table.name} pasifleştir`
                                        : `${table.name} aktifleştir`
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {table.active ? "Aktif" : "Pasif"}
                                  </span>
                                </div>
                              </td>
                              {editing ? (
                                <td
                                  colSpan={5}
                                  className="border border-gray-200 px-3 py-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-center gap-1">
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
                                </td>
                              ) : (
                                getRowActions(table).map((action) => (
                                  <td
                                    key={action.key}
                                    className="border border-gray-200 px-3 py-2 text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={`h-7 w-7 ${
                                        action.destructive
                                          ? "text-destructive hover:text-destructive"
                                          : ""
                                      }`}
                                      aria-label={action.label}
                                      disabled={action.disabled}
                                      onClick={action.onClick}
                                    >
                                      {action.icon}
                                    </Button>
                                  </td>
                                ))
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
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