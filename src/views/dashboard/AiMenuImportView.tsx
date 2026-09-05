"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Upload } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { SmartFeaturePanel } from "@/components/dashboard/SmartFeaturePanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useAiMenuImportAccess } from "@/hooks/use-ai-menu-import-access";
import {
  createAiMenuImportJob,
  getAiMenuImportJob,
  isAiImportJobCompleted,
  isAiImportJobPending,
} from "@/lib/ai-menu-import-api";
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

  const jobQuery = useQuery({
    queryKey: ["ai-menu-import-job", menuId, jobId],
    queryFn: () => getAiMenuImportJob(menuId as number, jobId as string),
    enabled: menuId != null && !!jobId && canUseAiMenuImport,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isAiImportJobPending(status) ? JOB_POLL_MS : false;
    },
  });

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
      notify("info", "AI menü import başlatıldı. Tamamlanınca ürünler menüye yazılır.");
    },
    onError: (error) => {
      notify("danger", error instanceof Error ? error.message : "Import başlatılamadı.");
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
  const jobDone = !!jobStatus && isAiImportJobCompleted(jobStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="AI ile ürün ekle"
        hint="Menü fotoğrafı yükleyin. AI ürünleri çıkarır, zenginleştirir ve menünüze yazar."
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
        disabled={selectionState.loading || startMutation.isPending || jobPending}
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
          disabled={jobPending}
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <p className="text-xs text-muted-foreground">{files.length} dosya seçildi</p>
        ) : null}
        <Button
          disabled={menuId == null || files.length === 0 || startMutation.isPending || jobPending}
          onClick={() => startMutation.mutate()}
          className="gap-1.5"
        >
          {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Analizi başlat
        </Button>
        {jobId ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Job: {jobId}
              {jobStatus ? ` — ${jobStatus}` : ""}
              {jobPending ? " (işleniyor…)" : ""}
            </p>
            {jobQuery.data?.errorMessage ? (
              <p className="text-destructive">{jobQuery.data.errorMessage}</p>
            ) : null}
            {jobDone ? (
              <p>
                Tamamlandı. {jobQuery.data?.publishedCount ?? 0} ürün menüye eklendi.{" "}
                <Link className="underline" href={DASHBOARD_ROUTES.digitalMenuProducts}>
                  Ürünlere git
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
