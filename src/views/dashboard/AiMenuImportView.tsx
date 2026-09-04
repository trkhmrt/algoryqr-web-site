"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, Sparkles, Upload } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { SmartFeaturePanel } from "@/components/dashboard/SmartFeaturePanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
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
import { useAiMenuImportAccess } from "@/hooks/use-ai-menu-import-access";
import { useMenuCategories } from "@/hooks/use-menu-categories";
import {
  approveAiMenuImportDraft,
  bulkApproveAiMenuImportDrafts,
  createAiMenuImportJob,
  draftField,
  draftPrice,
  getAiMenuImportJob,
  isAiImportJobPending,
  listAiMenuImportDrafts,
  rejectAiMenuImportDraft,
  updateAiMenuImportDraft,
  type AiMenuImportDraft,
} from "@/lib/ai-menu-import-api";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_PANEL } from "@/lib/dashboard-surface";
import { PRODUCT_HINTS } from "@/lib/product-hints";
import { uploadProductImage } from "@/lib/uploadProductImage";
import { cn } from "@/lib/utils";

const JOB_POLL_MS = 5_000;

export default function AiMenuImportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const {
    accessLoading: aiAccessLoading,
    canUseAiMenuImport,
    aiMenuImportPackageNames,
  } = useAiMenuImportAccess();

  const initialQrId = useMemo(() => {
    const raw = Number(searchParams.get("qr"));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const jobFromQuery = searchParams.get("job");

  const selectionState = useDigitalMenuSelection(initialQrId, true);
  const selectedQrId = selectionState.selection?.qr.id ?? null;
  const menuId = selectionState.selection?.menu.menuId ?? null;

  const [jobId, setJobId] = useState<string | null>(jobFromQuery);
  const [files, setFiles] = useState<File[]>([]);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<AiMenuImportDraft | null>(null);
  const [rejecting, setRejecting] = useState<AiMenuImportDraft | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    subCategoryId: "",
  });

  const categoriesQuery = useMenuCategories(menuId, !!menuId && canUseAiMenuImport);
  const subCategoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (const main of categoriesQuery.data ?? []) {
      for (const sub of main.subs ?? []) {
        options.push({
          value: String(sub.id),
          label: `${main.name} / ${sub.name}`,
        });
      }
    }
    return options;
  }, [categoriesQuery.data]);

  const jobQuery = useQuery({
    queryKey: ["ai-menu-import-job", menuId, jobId],
    queryFn: () => getAiMenuImportJob(menuId as number, jobId as string),
    enabled: menuId != null && !!jobId && canUseAiMenuImport,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isAiImportJobPending(status) ? JOB_POLL_MS : false;
    },
  });

  const draftsQuery = useQuery({
    queryKey: ["ai-menu-import-drafts", menuId, jobId, page],
    queryFn: () =>
      listAiMenuImportDrafts(menuId as number, {
        status: "WAITING_APPROVAL",
        jobId: jobId ?? undefined,
        page,
        size: 20,
      }),
    enabled:
      menuId != null &&
      canUseAiMenuImport &&
      (!!jobId ? jobQuery.data?.status === "WAITING_APPROVAL" : true),
    refetchInterval: 15_000,
  });

  const drafts = draftsQuery.data?.content ?? [];
  const totalPages = draftsQuery.data?.totalPages ?? 0;
  const allSelected = drafts.length > 0 && drafts.every((item) => selectedIds.includes(item.id));

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ai-menu-import-drafts"] });
    await queryClient.invalidateQueries({ queryKey: ["ai-menu-import-job"] });
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      if (menuId == null) throw new Error("Menü seçilmedi");
      if (files.length === 0) throw new Error("En az bir fotoğraf seçin");
      const urls: string[] = [];
      for (const file of files) {
        const uploaded = await uploadProductImage(menuId, file);
        urls.push(uploaded.imageUrl);
      }
      return createAiMenuImportJob(menuId, urls);
    },
    onSuccess: (result) => {
      setJobId(result.jobId);
      setFiles([]);
      const params = new URLSearchParams();
      if (selectedQrId != null) params.set("qr", String(selectedQrId));
      params.set("job", result.jobId);
      router.replace(`${DASHBOARD_ROUTES.digitalMenuAiImport}?${params.toString()}`);
      notify("info", "AI menü import başlatıldı.");
    },
    onError: (error) => {
      notify("danger", error instanceof Error ? error.message : "Import başlatılamadı.");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (draftId: string) => approveAiMenuImportDraft(menuId as number, draftId),
    onSuccess: async () => {
      setSelectedIds([]);
      await invalidate();
      notify("info", "Ürün menüye eklendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Onay başarısız.");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: () => bulkApproveAiMenuImportDrafts(menuId as number, selectedIds),
    onSuccess: async () => {
      setSelectedIds([]);
      await invalidate();
      notify("info", "Seçili ürünler menüye eklendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Toplu onay başarısız.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectAiMenuImportDraft(menuId as number, rejecting?.id as string, rejectReason.trim()),
    onSuccess: async () => {
      setRejecting(null);
      setRejectReason("");
      await invalidate();
      notify("info", "Ürün iptal edildi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "İptal başarısız.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAiMenuImportDraft(menuId as number, editing?.id as string, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: editForm.price ? Number(editForm.price.replace(",", ".")) : undefined,
        subCategoryId: editForm.subCategoryId ? Number(editForm.subCategoryId) : undefined,
      }),
    onSuccess: async () => {
      setEditing(null);
      await invalidate();
      notify("info", "Taslak güncellendi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Güncelleme başarısız.");
    },
  });

  if (accessLoading || aiAccessLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-destructive">Dijital menü erişiminiz yok.</p>;
  }

  if (!canUseAiMenuImport) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader
          title="AI ile ürün ekle"
          hint={PRODUCT_HINTS.AI_MENU_IMPORT.description}
          back={
            <Link href={DASHBOARD_ROUTES.digitalMenuProducts} aria-label="Ürünlere dön" className={DASHBOARD_BACK}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
        <SmartFeaturePanel
          title={PRODUCT_HINTS.AI_MENU_IMPORT.title}
          hint={PRODUCT_HINTS.AI_MENU_IMPORT}
          description={`Aktif paketinizde AI menü import yok. ${
            aiMenuImportPackageNames.length > 0
              ? aiMenuImportPackageNames.join(" veya ")
              : "Ultimate"
          } paketi ile menü fotoğrafından ürün ekleyebilirsiniz.`}
          actionLabel="Paketi incele"
          onActionClick={() => router.push(DASHBOARD_ROUTES.accountPackagesHighlight("AI_MENU_IMPORT"))}
        />
      </div>
    );
  }

  const jobStatus = jobQuery.data?.status;
  const jobPending = !!jobStatus && isAiImportJobPending(jobStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="AI ile ürün ekle"
        hint="Menü fotoğrafı yükleyin; AI ürünleri çıkarıp açıklama ve besin değeri üretir. Onayladıklarınız menüye eklenir."
        back={
          <Link href={DASHBOARD_ROUTES.digitalMenuProducts} aria-label="Ürünlere dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <DigitalMenuPicker
        menuQrs={selectionState.menuQrs}
        selectedQrId={selectedQrId}
        onSelectQrId={(id) => void selectionState.selectQrId(id)}
        disabled={selectionState.loading || startMutation.isPending}
      />

      <div className={cn(DASHBOARD_PANEL, "space-y-4")}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Menü fotoğrafı yükle
        </div>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <p className="text-xs text-muted-foreground">{files.length} dosya seçildi</p>
        ) : null}
        <Button
          disabled={menuId == null || files.length === 0 || startMutation.isPending}
          onClick={() => startMutation.mutate()}
          className="gap-1.5"
        >
          {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Analizi başlat
        </Button>
        {jobId ? (
          <p className="text-sm text-muted-foreground">
            Job: {jobId}
            {jobStatus ? ` — ${jobStatus}` : ""}
            {jobPending ? " (işleniyor…)" : ""}
            {jobQuery.data?.errorMessage ? ` — ${jobQuery.data.errorMessage}` : ""}
          </p>
        ) : null}
      </div>

      <div className={cn(DASHBOARD_PANEL, "space-y-4")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Onay bekleyen taslaklar</h2>
          <Button
            size="sm"
            disabled={selectedIds.length === 0 || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate()}
          >
            Seçilileri onayla ({selectedIds.length})
          </Button>
        </div>

        {draftsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Taslaklar yükleniyor...</p>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {jobPending
              ? "Ürünler çıkarılıyor ve zenginleştiriliyor. Bu işlem batch nedeniyle biraz sürebilir."
              : "Onay bekleyen taslak yok."}
          </p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) =>
                  setSelectedIds(checked ? drafts.map((item) => item.id) : [])
                }
              />
              Tümünü seç
            </label>
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedIds.includes(draft.id)}
                    onCheckedChange={(checked) => {
                      setSelectedIds((prev) =>
                        checked ? [...prev, draft.id] : prev.filter((id) => id !== draft.id),
                      );
                    }}
                  />
                  <div>
                    <p className="font-medium">{draftField(draft, "name") || "Adsız ürün"}</p>
                    <p className="text-xs text-muted-foreground">
                      {draftPrice(draft) || "—"} {draftField(draft, "currency") || "TRY"}
                      {draftField(draft, "category")
                        ? ` · ${draftField(draft, "category")}`
                        : ""}
                      {draftField(draft, "subcategory")
                        ? ` / ${draftField(draft, "subcategory")}`
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {draftField(draft, "description")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(draft);
                      setEditForm({
                        name: draftField(draft, "name"),
                        description: draftField(draft, "description"),
                        price: draftPrice(draft),
                        subCategoryId: draftField(draft, "subCategoryId"),
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(draft.id)}
                  >
                    Onayla
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejecting(draft)}>
                    İptal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Önceki
            </Button>
            <span className="text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </Button>
          </div>
        ) : null}
      </div>

      <AlertDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Taslağı düzenle</AlertDialogTitle>
            <AlertDialogDescription>
              Onay öncesi ad, fiyat, açıklama ve alt kategoriyi güncelleyin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Ad</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Fiyat</Label>
              <Input
                value={editForm.price}
                onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Alt kategori</Label>
              <SearchableSelect
                value={editForm.subCategoryId}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, subCategoryId: value }))
                }
                options={subCategoryOptions}
                placeholder="Alt kategori seçin"
                searchPlaceholder="Ara..."
              />
            </div>
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü iptal et</AlertDialogTitle>
            <AlertDialogDescription>
              Bu taslak menüye eklenmez. İsterseniz kısa bir neden yazın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="İptal nedeni (opsiyonel)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              İptal et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
