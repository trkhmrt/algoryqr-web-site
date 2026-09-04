"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

import { IntegrationsSectionHeader } from "@/components/dashboard/IntegrationsSectionHeader";
import {
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { UBER_EATS_SOFT_CARD_CLASS } from "@/lib/ubereats-ui";
import {
  approvePendingProduct,
  bulkApprovePendingProducts,
  listPendingProducts,
  productField,
  productPrice,
  rejectPendingProduct,
  updatePendingProduct,
  type IntegrationPendingProduct,
  type PublishTarget,
} from "@/lib/ubereats-menu-api";
import { cn } from "@/lib/utils";

const TARGET_OPTIONS: { value: PublishTarget; label: string }[] = [
  { value: "INTERNAL_MENU", label: "Kendi menüm" },
  { value: "UBEREATS", label: "Uber Eats" },
];

export default function UberEatsPendingView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const menusQuery = useDigitalMenuOptions(canUseDigitalMenu && !accessLoading);
  const menus = menusQuery.menuQrs;
  const [menuId, setMenuId] = useState<number | null>(null);
  const selectedMenuId = menuId ?? menus[0]?.menuId ?? null;
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targets, setTargets] = useState<PublishTarget[]>(["INTERNAL_MENU"]);
  const [editing, setEditing] = useState<IntegrationPendingProduct | null>(null);
  const [rejecting, setRejecting] = useState<IntegrationPendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    imageUrl: "",
  });

  const pendingQuery = useQuery({
    queryKey: ["uber-eats-pending", selectedMenuId, page],
    queryFn: () =>
      listPendingProducts(selectedMenuId as number, {
        status: "WAITING_APPROVAL",
        page,
        size: 20,
      }),
    enabled: selectedMenuId != null && canUseDigitalMenu,
    refetchInterval: 15_000,
  });

  const products = pendingQuery.data?.content ?? [];
  const totalPages = pendingQuery.data?.totalPages ?? 0;
  const totalElements = pendingQuery.data?.totalElements ?? 0;
  const allSelected = products.length > 0 && products.every((item) => selectedIds.includes(item.id));

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["uber-eats-pending"] });
    await queryClient.invalidateQueries({ queryKey: ["uber-eats-pending-count"] });
  };

  const approveMutation = useMutation({
    mutationFn: (productId: string) =>
      approvePendingProduct(selectedMenuId as number, productId, targets),
    onSuccess: async () => {
      setSelectedIds([]);
      await invalidate();
      notify("info", "Ürün onaylandı, yayın kuyruğuna alındı.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Onay başarısız.");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: () =>
      bulkApprovePendingProducts(selectedMenuId as number, selectedIds, targets),
    onSuccess: async () => {
      setSelectedIds([]);
      await invalidate();
      notify("info", "Seçili ürünler onaylandı.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Toplu onay başarısız.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectPendingProduct(selectedMenuId as number, rejecting?.id as string, rejectReason.trim()),
    onSuccess: async () => {
      setRejecting(null);
      setRejectReason("");
      await invalidate();
      notify("info", "Ürün reddedildi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Reddetme başarısız.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePendingProduct(selectedMenuId as number, editing?.id as string, {
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        price: editForm.price.trim() ? Number(editForm.price) : undefined,
        category: editForm.category.trim() || undefined,
        subcategory: editForm.subcategory.trim() || undefined,
        imageUrl: editForm.imageUrl.trim() || undefined,
      }),
    onSuccess: async () => {
      setEditing(null);
      await invalidate();
      notify("info", "Ürün güncellendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Güncelleme başarısız.");
    },
  });

  const targetSummary = useMemo(
    () =>
      TARGET_OPTIONS.filter((option) => targets.includes(option.value))
        .map((option) => option.label)
        .join(" + ") || "Hedef seçin",
    [targets],
  );

  if (accessLoading || menusQuery.loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href={DASHBOARD_ROUTES.uberEats}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Uber Eats
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <IntegrationsSectionHeader
          brandDescription="Menü senkronu, onay akışı ve Uber mağaza bağlantısını buradan yönetin."
          pageTitle="Onay bekleyen ürünler"
          pageDescription="AI eşleştirmelerini inceleyip yayın hedefini seçin"
        />
        <div className="flex shrink-0 lg:pt-8">
          <Button asChild variant="outline">
            <Link href={DASHBOARD_ROUTES.uberEats}>Bağlantı</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Bekleyen</p>
          <p className="mt-1 text-xl font-semibold">{totalElements}</p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Seçili</p>
          <p className="mt-1 text-xl font-semibold">{selectedIds.length}</p>
        </div>
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} p-6`}>
          <p className="text-xs text-muted-foreground">Yayın hedefi</p>
          <p className="mt-1 text-sm font-semibold">{targetSummary}</p>
        </div>
      </div>

      <div className={`${UBER_EATS_SOFT_CARD_CLASS} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Label htmlFor="pending-menu">Menü</Label>
            <select
              id="pending-menu"
              className="flex h-10 w-full min-w-[16rem] rounded-md border border-input bg-background px-3 text-sm"
              value={selectedMenuId ?? ""}
              onChange={(event) => {
                setMenuId(Number(event.target.value) || null);
                setPage(0);
                setSelectedIds([]);
              }}
            >
              {menus.map((menu) => (
                <option key={menu.menuId} value={menu.menuId ?? ""}>
                  {menu.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            {TARGET_OPTIONS.map((option) => {
              const checked = targets.includes(option.value);
              return (
                <label key={option.value} className="inline-flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setTargets((current) => {
                        if (value) return [...new Set([...current, option.value])];
                        return current.filter((item) => item !== option.value);
                      });
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={products.length === 0}
            onClick={() => {
              if (allSelected) {
                setSelectedIds((current) =>
                  current.filter((id) => !products.some((product) => product.id === id)),
                );
                return;
              }
              setSelectedIds((current) => [
                ...new Set([...current, ...products.map((product) => product.id)]),
              ]);
            }}
          >
            {allSelected ? "Seçimi kaldır" : "Sayfadakileri seç"}
          </Button>
          <Button
            type="button"
            disabled={selectedIds.length === 0 || targets.length === 0 || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate()}
          >
            {bulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Toplu onayla ({selectedIds.length})
          </Button>
        </div>
      </div>

      {pendingQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className={`${UBER_EATS_SOFT_CARD_CLASS} border-dashed p-10 text-center`}>
          <p className="font-medium">Onay bekleyen ürün yok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            İçe veya dışa aktarım sonrası AI sonuçları burada listelenir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const name = productField(product, "name") || product.sourceProductId || "Ürün";
            const description = productField(product, "description");
            const category = productField(product, "category");
            const subcategory = productField(product, "subcategory");
            const imageUrl = productField(product, "imageUrl");
            const price = productPrice(product);
            const checked = selectedIds.includes(product.id);
            return (
              <div key={product.id} className={`${UBER_EATS_SOFT_CARD_CLASS} p-4 sm:p-5`}>
                <div className="flex gap-4">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setSelectedIds((current) =>
                        value
                          ? [...current, product.id]
                          : current.filter((id) => id !== product.id),
                      );
                    }}
                    className="mt-1"
                  />
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                      Görsel yok
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[category, subcategory].filter(Boolean).join(" / ") || "Kategori yok"}
                          {price != null ? ` · ${price} ${productField(product, "currency") || "TRY"}` : ""}
                        </p>
                      </div>
                      {product.confidence != null ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Güven %{Math.round(product.confidence * 100)}
                        </span>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
                    ) : null}
                    {product.warnings && product.warnings.length > 0 ? (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {product.warnings.join(" · ")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={targets.length === 0 || approveMutation.isPending}
                        onClick={() => approveMutation.mutate(product.id)}
                      >
                        Onayla
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(product);
                          setEditForm({
                            name: productField(product, "name"),
                            description: productField(product, "description"),
                            price: price == null ? "" : String(price),
                            category: productField(product, "category"),
                            subcategory: productField(product, "subcategory"),
                            imageUrl: productField(product, "imageUrl"),
                          });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setRejecting(product);
                          setRejectReason("");
                        }}
                      >
                        Reddet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Önceki
          </Button>
          <p className="text-sm text-muted-foreground">
            Sayfa {page + 1} / {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sonraki
          </Button>
        </div>
      ) : null}

      <AlertDialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü düzenle</AlertDialogTitle>
            <AlertDialogDescription>
              Onay öncesi ad, açıklama, fiyat ve kategori alanlarını güncelleyin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Ad</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Açıklama</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Fiyat</Label>
                <Input
                  id="edit-price"
                  value={editForm.price}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Görsel URL</Label>
                <Input
                  id="edit-image"
                  value={editForm.imageUrl}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, imageUrl: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Input
                  id="edit-category"
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subcategory">Alt kategori</Label>
                <Input
                  id="edit-subcategory"
                  value={editForm.subcategory}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, subcategory: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                updateMutation.mutate();
              }}
            >
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejecting != null} onOpenChange={(open) => !open && setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü reddet?</AlertDialogTitle>
            <AlertDialogDescription>
              Reddedilen ürün yayınlanmaz. İsterseniz bir gerekçe yazın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Gerekçe</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Örn. Kategori uygun değil"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                rejectMutation.mutate();
              }}
            >
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
