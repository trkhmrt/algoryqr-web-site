"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createMenuCategoryRequest,
  createMenuSubCategoryRequest,
  deleteMenuCategoryRequest,
  deleteMenuSubCategoryRequest,
  updateMenuCategoryRequest,
  updateMenuSubCategoryRequest,
  type MainCategoryApiItem,
  type SubCategoryApiItem,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateMenuCategories, useMenuCategories } from "@/hooks/use-menu-categories";
import { useMenuByQr } from "@/hooks/use-menu-by-qr";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

type MenuCategoriesPanelProps = {
  menuId: number;
  qrId: number;
  onAddProduct?: (subCategoryId: number) => void;
};

type NameDialogState =
  | { kind: "create-main" }
  | { kind: "rename-main"; main: MainCategoryApiItem }
  | { kind: "create-sub"; main: MainCategoryApiItem }
  | { kind: "rename-sub"; sub: SubCategoryApiItem }
  | null;

type DeleteTarget =
  | { kind: "main"; id: number; name: string }
  | { kind: "sub"; id: number; name: string }
  | null;

function matchesSearch(main: MainCategoryApiItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLocaleLowerCase("tr");
  if (main.name.toLocaleLowerCase("tr").includes(q) || main.slug.toLocaleLowerCase("tr").includes(q)) {
    return true;
  }
  return (main.subs ?? []).some(
    (sub) =>
      sub.name.toLocaleLowerCase("tr").includes(q) || sub.slug.toLocaleLowerCase("tr").includes(q),
  );
}

function bySortOrderThenId<T extends { sortOrder: number; id: number }>(a: T, b: T): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id - b.id;
}

function sortCategories(list: MainCategoryApiItem[]): MainCategoryApiItem[] {
  return [...list]
    .map((main) => ({
      ...main,
      subs: [...(main.subs ?? [])].sort(bySortOrderThenId),
    }))
    .sort(bySortOrderThenId);
}

function DragHandle({
  attributes,
  listeners,
  disabled,
}: {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing hover:bg-muted/60",
      )}
      disabled={disabled}
      aria-label="Sürükleyerek sırala"
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

function SortableSubRow({
  sub,
  busy,
  dragDisabled,
  onRename,
  onDelete,
  onAddProduct,
}: {
  sub: SubCategoryApiItem;
  busy: boolean;
  dragDisabled: boolean;
  onRename: () => void;
  onDelete: () => void;
  onAddProduct?: (subCategoryId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sub-${sub.id}`,
    disabled: dragDisabled || busy,
    data: { type: "sub", subId: sub.id, mainCategoryId: sub.mainCategoryId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "ml-1 flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-2 sm:ml-4",
        isDragging && "z-10 bg-background shadow-md",
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <DragHandle attributes={attributes} listeners={listeners} disabled={dragDisabled || busy} />
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{sub.name}</span>
        <span className="truncate text-xs text-muted-foreground">{sub.slug}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onAddProduct ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={busy}
            onClick={() => onAddProduct(sub.id)}
          >
            Ürün ekle
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={busy}
          onClick={onRename}
          aria-label="Alt kategoriyi yeniden adlandır"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          disabled={busy}
          onClick={onDelete}
          aria-label="Alt kategoriyi sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SortableMainBlock({
  main,
  expanded,
  busy,
  dragDisabled,
  onToggle,
  onRename,
  onDelete,
  onAddSub,
  onRenameSub,
  onDeleteSub,
  onAddProduct,
}: {
  main: MainCategoryApiItem;
  expanded: boolean;
  busy: boolean;
  dragDisabled: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddSub: () => void;
  onRenameSub: (sub: SubCategoryApiItem) => void;
  onDeleteSub: (sub: SubCategoryApiItem) => void;
  onAddProduct?: (subCategoryId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `main-${main.id}`,
    disabled: dragDisabled || busy,
    data: { type: "main", mainId: main.id },
  });
  const subCount = main.subs?.length ?? 0;
  const subIds = (main.subs ?? []).map((sub) => `sub-${sub.id}`);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-xl border border-border/80", isDragging && "z-10 bg-background shadow-md")}
    >
      <div className="flex items-center gap-1 px-2 py-2 sm:px-3">
        <DragHandle attributes={attributes} listeners={listeners} disabled={dragDisabled || busy} />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{main.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {main.slug}
              {subCount > 0 ? ` · ${subCount} alt kategori` : ""}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded ? "rotate-180" : "rotate-0",
            )}
          />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={busy}
          onClick={onRename}
          aria-label="Kategoriyi yeniden adlandır"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          disabled={busy}
          onClick={onDelete}
          aria-label="Kategoriyi sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {expanded ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-3">
          {subCount === 0 ? (
            <p className="text-xs text-muted-foreground">Alt kategori yok.</p>
          ) : (
            <SortableContext items={subIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {(main.subs ?? []).map((sub) => (
                  <SortableSubRow
                    key={sub.id}
                    sub={sub}
                    busy={busy}
                    dragDisabled={dragDisabled}
                    onRename={() => onRenameSub(sub)}
                    onDelete={() => onDeleteSub(sub)}
                    onAddProduct={onAddProduct}
                  />
                ))}
              </div>
            </SortableContext>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={busy}
            onClick={onAddSub}
          >
            <Plus className="h-3.5 w-3.5" />
            Alt kategori ekle
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function dialogTitle(state: NameDialogState): string {
  if (!state) return "";
  switch (state.kind) {
    case "create-main":
      return "Ana kategori ekle";
    case "rename-main":
      return "Kategoriyi yeniden adlandır";
    case "create-sub":
      return "Alt kategori ekle";
    case "rename-sub":
      return "Alt kategoriyi yeniden adlandır";
  }
}

function dialogInitialName(state: NameDialogState): string {
  if (!state) return "";
  if (state.kind === "rename-main") return state.main.name;
  if (state.kind === "rename-sub") return state.sub.name;
  return "";
}

export default function MenuCategoriesPanel({
  menuId,
  qrId,
  onAddProduct,
}: MenuCategoriesPanelProps) {
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const menuByQr = useMenuByQr(qrId, menuId <= 0);
  const resolvedMenuId =
    menuId > 0
      ? menuId
      : menuByQr.data?.menuId != null && menuByQr.data.menuId > 0
        ? menuByQr.data.menuId
        : 0;

  const categoriesQuery = useMenuCategories(resolvedMenuId > 0 ? resolvedMenuId : null);
  const [orderedCategories, setOrderedCategories] = useState<MainCategoryApiItem[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (categoriesQuery.data) {
      setOrderedCategories(sortCategories(categoriesQuery.data));
    }
  }, [categoriesQuery.data]);

  useEffect(() => {
    if (categoriesQuery.isError) {
      notify(
        "danger",
        categoriesQuery.error instanceof Error
          ? categoriesQuery.error.message
          : "Kategori listesi alınamadı.",
      );
    }
  }, [categoriesQuery.error, categoriesQuery.isError, notify]);

  const filtered = useMemo(
    () => orderedCategories.filter((main) => matchesSearch(main, debouncedSearch)),
    [orderedCategories, debouncedSearch],
  );
  const expandAllFromSearch = Boolean(debouncedSearch);
  const dragDisabled = expandAllFromSearch || reordering;
  const mainIds = filtered.map((main) => `main-${main.id}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const refresh = () => invalidateMenuCategories(queryClient, resolvedMenuId, qrId);

  const persistMainOrder = async (next: MainCategoryApiItem[]) => {
    if (resolvedMenuId <= 0) return;
    setReordering(true);
    const previous = orderedCategories;
    setOrderedCategories(next);
    try {
      await Promise.all(
        next.map((main, index) =>
          main.sortOrder === index
            ? Promise.resolve()
            : updateMenuCategoryRequest(resolvedMenuId, main.id, { sortOrder: index }),
        ),
      );
      await refresh();
    } catch (error) {
      setOrderedCategories(previous);
      notify("danger", error instanceof Error ? error.message : "Sıralama kaydedilemedi.");
    } finally {
      setReordering(false);
    }
  };

  const persistSubOrder = async (mainId: number, nextSubs: SubCategoryApiItem[]) => {
    if (resolvedMenuId <= 0) return;
    setReordering(true);
    const previous = orderedCategories;
    setOrderedCategories((current) =>
      current.map((main) => (main.id === mainId ? { ...main, subs: nextSubs } : main)),
    );
    try {
      await Promise.all(
        nextSubs.map((sub, index) =>
          sub.sortOrder === index
            ? Promise.resolve()
            : updateMenuSubCategoryRequest(resolvedMenuId, sub.id, { sortOrder: index }),
        ),
      );
      await refresh();
    } catch (error) {
      setOrderedCategories(previous);
      notify("danger", error instanceof Error ? error.message : "Sıralama kaydedilemedi.");
    } finally {
      setReordering(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (dragDisabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = String(active.id).startsWith("sub-") ? "sub" : "main";
    const overType = String(over.id).startsWith("sub-") ? "sub" : "main";
    if (activeType !== overType) return;

    if (activeType === "main") {
      const oldIndex = filtered.findIndex((main) => `main-${main.id}` === active.id);
      const newIndex = filtered.findIndex((main) => `main-${main.id}` === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reorderedFiltered = arrayMove(filtered, oldIndex, newIndex);
      const filteredIds = new Set(reorderedFiltered.map((main) => main.id));
      const untouched = orderedCategories.filter((main) => !filteredIds.has(main.id));
      const next = [...reorderedFiltered, ...untouched].map((main, index) => ({
        ...main,
        sortOrder: index,
      }));
      void persistMainOrder(next);
      return;
    }

    const activeSubId = Number(String(active.id).replace("sub-", ""));
    const overSubId = Number(String(over.id).replace("sub-", ""));
    if (!Number.isFinite(activeSubId) || !Number.isFinite(overSubId)) return;
    const main = orderedCategories.find((item) =>
      (item.subs ?? []).some((sub) => sub.id === activeSubId),
    );
    if (!main) return;
    const subs = main.subs ?? [];
    const overInSameMain = subs.some((sub) => sub.id === overSubId);
    if (!overInSameMain) return;
    const oldIndex = subs.findIndex((sub) => sub.id === activeSubId);
    const newIndex = subs.findIndex((sub) => sub.id === overSubId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const nextSubs = arrayMove(subs, oldIndex, newIndex).map((sub, index) => ({
      ...sub,
      sortOrder: index,
    }));
    void persistSubOrder(main.id, nextSubs);
  };

  const toggleMain = (id: number) => {
    if (expandAllFromSearch) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNameDialog = (state: Exclude<NameDialogState, null>) => {
    setNameDialog(state);
    setNameValue(dialogInitialName(state));
  };

  const handleSaveName = async () => {
    if (!nameDialog || resolvedMenuId <= 0) return;
    const trimmed = nameValue.trim();
    if (!trimmed) {
      notify("warning", "Kategori adı zorunlu.");
      return;
    }
    setSaving(true);
    try {
      switch (nameDialog.kind) {
        case "create-main":
          await createMenuCategoryRequest(resolvedMenuId, {
            name: trimmed,
            sortOrder: orderedCategories.length,
          });
          notify("info", "Kategori eklendi.");
          break;
        case "rename-main":
          await updateMenuCategoryRequest(resolvedMenuId, nameDialog.main.id, { name: trimmed });
          notify("info", "Kategori güncellendi.");
          break;
        case "create-sub":
          await createMenuSubCategoryRequest(resolvedMenuId, nameDialog.main.id, {
            name: trimmed,
            sortOrder: nameDialog.main.subs?.length ?? 0,
          });
          setExpandedIds((prev) => new Set(prev).add(nameDialog.main.id));
          notify("info", "Alt kategori eklendi.");
          break;
        case "rename-sub":
          await updateMenuSubCategoryRequest(resolvedMenuId, nameDialog.sub.id, {
            name: trimmed,
          });
          notify("info", "Alt kategori güncellendi.");
          break;
      }
      setNameDialog(null);
      await refresh();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || resolvedMenuId <= 0) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "main") {
        await deleteMenuCategoryRequest(resolvedMenuId, deleteTarget.id);
        notify("info", "Kategori silindi.");
      } else {
        await deleteMenuSubCategoryRequest(resolvedMenuId, deleteTarget.id);
        notify("info", "Alt kategori silindi.");
      }
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Silme başarısız.");
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting || reordering;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kategori ara…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1"
          disabled={busy || resolvedMenuId <= 0}
          onClick={() => openNameDialog({ kind: "create-main" })}
        >
          <Plus className="h-3.5 w-3.5" />
          Kategori ekle
        </Button>
      </div>

      {expandAllFromSearch ? (
        <p className="text-xs text-muted-foreground">Arama açıkken sürükle-bırak kapalıdır.</p>
      ) : orderedCategories.length > 1 || orderedCategories.some((main) => (main.subs?.length ?? 0) > 1) ? (
        <p className="text-xs text-muted-foreground">
          Sıralamak için sol taraftaki tutamacı sürükleyin.
        </p>
      ) : null}

      {categoriesQuery.isLoading || (menuId <= 0 && menuByQr.isLoading) ? (
        <p className="text-sm text-muted-foreground">Kategoriler yükleniyor…</p>
      ) : categoriesQuery.isError ? (
        <p className="text-sm text-destructive">Kategori listesi alınamadı.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {debouncedSearch
            ? "Aramayla eşleşen kategori bulunamadı."
            : "Henüz kategori yok. Yeni ana kategori ekleyin."}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={mainIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filtered.map((main) => (
                <SortableMainBlock
                  key={main.id}
                  main={main}
                  expanded={expandAllFromSearch || expandedIds.has(main.id)}
                  busy={busy}
                  dragDisabled={dragDisabled}
                  onToggle={() => toggleMain(main.id)}
                  onRename={() => openNameDialog({ kind: "rename-main", main })}
                  onDelete={() => setDeleteTarget({ kind: "main", id: main.id, name: main.name })}
                  onAddSub={() => openNameDialog({ kind: "create-sub", main })}
                  onRenameSub={(sub) => openNameDialog({ kind: "rename-sub", sub })}
                  onDeleteSub={(sub) => setDeleteTarget({ kind: "sub", id: sub.id, name: sub.name })}
                  onAddProduct={onAddProduct}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog
        open={nameDialog != null}
        onOpenChange={(open) => {
          if (!open && !saving) setNameDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle(nameDialog)}</DialogTitle>
            <DialogDescription>Görünen ad menüde ve ürün seçiminde kullanılır.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Ad</Label>
            <Input
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSaveName();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setNameDialog(null)}
            >
              Vazgeç
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSaveName()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === "main" ? "Kategori silinsin mi?" : "Alt kategori silinsin mi?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" kalıcı olarak silinecek. Ürünü olan kategoriler silinemez.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Siliniyor…" : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
