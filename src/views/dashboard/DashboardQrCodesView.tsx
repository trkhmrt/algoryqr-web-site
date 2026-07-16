"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  createQrRequest, deleteQrRequest, getStoredUser, getUserQrsRequest,
  QrResponse, StoredUser, updateQrNameRequest, updateQrRequest,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTrigger, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  QrCode, Plus, Eye, Calendar, Download, Share2, Trash2, Edit, Copy,
  Link as LinkIcon, Wifi, Mail, Phone, FileText, MapPin, Paintbrush, RotateCcw, Check, ArrowLeft, UtensilsCrossed,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PackageUsageCard from "@/components/dashboard/PackageUsageCard";
import { QRCodesSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { QrTypeDetails, QrTypeData, QrTypeValue } from "@/components/dashboard/qr-create/QrTypeDetails";
import {
  createInitialQrTypeData, getQrDetailsByType, getBackendTypeFromDetails,
  mapDetailsToQrTypeData, getReadableDetailRows, mapUserQrToDashboardItem,
  isMenuQrDetails,
  type DashboardQrItem,
} from "@/components/dashboard/qr/qr-mappers";
import MenuProductsPanel from "@/components/dashboard/menu/MenuProductsPanel";
import { getMenuByQrIdRequest, updateMenuRequest } from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidatePackageUsage, usePackageUsage } from "@/hooks/use-package-usage";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { hasScope } from "@/lib/auth-user";
import { useAccessProfile } from "@/hooks/use-access-profile";

const qrTypes = [
  { value: "link", label: "Link", icon: LinkIcon, desc: "Web sitesi veya URL" },
  { value: "wifi", label: "WiFi", icon: Wifi, desc: "Kablosuz ağ bilgisi" },
  { value: "mail", label: "E-Posta", icon: Mail, desc: "E-posta şablonu" },
  { value: "contact", label: "İletişim", icon: Phone, desc: "vCard bilgileri" },
  { value: "text", label: "Metin", icon: FileText, desc: "Düz metin içeriği" },
  { value: "location", label: "Konum", icon: MapPin, desc: "GPS koordinatları" },
  { value: "menu", label: "Menü QR", icon: UtensilsCrossed, desc: "Dijital menü sayfası" },
] as const;

function useTooltipStyle() {
  return {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  };
}

export type QrCodesMode = "list" | "create" | "detail";

interface DashboardQrCodesViewProps {
  mode: QrCodesMode;
  qrId?: number;
  initialUser?: StoredUser | null;
}

const DashboardQrCodesView = ({ mode, qrId, initialUser = null }: DashboardQrCodesViewProps) => {
  const tooltipStyle = useTooltipStyle();
   // Arka planda access token süresi bitmeden refresh (şu an refresh çağrısı yorumda)
  const user = useMemo(() => initialUser || getStoredUser(), [initialUser]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { data: packageUsage, isLoading: isPackageUsageLoading } = usePackageUsage(mode === "create");
  const { data: accessProfile } = useAccessProfile();
  const canCreateQr = hasScope(accessProfile, "QR_CREATE_OWNER");
  const canCreateMenu = hasScope(accessProfile, "QR_MENU_OWNER");
  const [isLoading, setIsLoading] = useState(false);

  // QR Creation state
  const [selectedQrType, setSelectedQrType] = useState<QrTypeValue>("link");
  const [qrName, setQrName] = useState("");
  const [qrTypeData, setQrTypeData] = useState<QrTypeData>(() => createInitialQrTypeData());
  const [qrColor, setQrColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrTracking, setQrTracking] = useState(true);
  const [latestQrResponse, setLatestQrResponse] = useState<QrResponse | null>(null);
  const [userQrs, setUserQrs] = useState<DashboardQrItem[]>([]);

  // QR Detail/Edit state
  const [selectedQR, setSelectedQR] = useState<DashboardQrItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editQrType, setEditQrType] = useState<QrTypeValue>("link");
  const [editQrTypeData, setEditQrTypeData] = useState<QrTypeData>(() => createInitialQrTypeData());
  const [menuId, setMenuId] = useState<number | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // UI: Kaydet butonunun hangi uyarıyı göstermesi gerektiğini belirler.
  const editNameTrimmed = editName.trim();
  const editOriginalType = selectedQR ? getBackendTypeFromDetails(selectedQR.details) : editQrType;
  const editOriginalDetailsData = selectedQR ? mapDetailsToQrTypeData(selectedQR.details) : createInitialQrTypeData();
  const nameChangedForUi = selectedQR ? editNameTrimmed !== selectedQR.name : false;
  const activeUnchangedForUi = selectedQR ? editActive === selectedQR.active : false;
  const detailsUnchangedForUi = selectedQR
    ? editQrType === editOriginalType && JSON.stringify(editQrTypeData) === JSON.stringify(editOriginalDetailsData)
    : false;
  const nameOnlyEditForUi = selectedQR ? nameChangedForUi && activeUnchangedForUi && detailsUnchangedForUi : false;
  const hasChangesForUi = selectedQR ? nameChangedForUi || !activeUnchangedForUi || !detailsUnchangedForUi : false;

  const fetchUserQrs = useCallback(async (): Promise<DashboardQrItem[]> => {
    setIsLoading(true);
    try {
      const response = await getUserQrsRequest(user?.id ?? "me");
      const mapped = response.map(mapUserQrToDashboardItem);
      setUserQrs(mapped);
      return mapped;
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kodlar getirilemedi.";
      notify("danger", message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [notify, user?.id]);

  const handleDeleteQr = useCallback(async (qr: DashboardQrItem) => {
    try {
      await deleteQrRequest(qr.id);
      setUserQrs((prev) => prev.filter((item) => item.id !== qr.id));
      setSelectedQR((prev) => (prev?.id === qr.id ? null : prev));
      setIsEditing(false);
      await invalidatePackageUsage(queryClient);
      router.push(DASHBOARD_ROUTES.qrCodes);
      notify("info", `"${qr.name}" silindi.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod silinemedi.";
      notify("danger", message);
    }
  }, [notify, queryClient, router]);

  const handleSaveQrEdit = useCallback(async () => {
    if (!selectedQR) return;

    const trimmedName = editName.trim();

    if (!trimmedName) {
      notify("warning", "QR kod adı zorunlu.");
      return;
    }

    const originalType = getBackendTypeFromDetails(selectedQR.details);
    const originalDetailsData = mapDetailsToQrTypeData(selectedQR.details);
    const nameChanged = trimmedName !== selectedQR.name;
    const activeUnchanged = editActive === selectedQR.active;
    const detailsUnchanged = editQrType === originalType && JSON.stringify(editQrTypeData) === JSON.stringify(originalDetailsData);

    // Hiçbir şey değişmediyse çağrı yapma.
    if (!nameChanged && activeUnchanged && detailsUnchanged) {
      setIsEditing(false);
      return;
    }

    const nameOnlyEdit = nameChanged && activeUnchanged && detailsUnchanged;

    if (editQrType === "menu" && menuId != null && !nameOnlyEdit) {
      const menu = editQrTypeData.menu;
      try {
        if (nameChanged) {
          await updateQrNameRequest(selectedQR.id, { qrName: trimmedName });
        }
        const profile = await updateMenuRequest(menuId, {
          businessName: menu.businessName,
          phone: menu.phone,
          email: menu.email,
          address: menu.address,
          themeId: menu.themeId,
          urlMode: menu.urlMode.toUpperCase(),
          publicSlug: menu.urlMode === "slug" ? menu.publicSlug : undefined,
          active: editActive,
        });
        const refreshedQrs = await fetchUserQrs();
        const refreshedSelected = refreshedQrs.find((item) => item.id === selectedQR.id) ?? null;
        setSelectedQR(refreshedSelected);
        setPublicUrl(profile.publicUrl);
        setIsEditing(false);
        notify("info", `"${trimmedName}" menü bilgileri güncellendi.`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Menü güncellenemedi.";
        notify("danger", message);
        return;
      }
    }

    // Name-only edit: PATCH /qr/update-name -> yeni QR üretmez.
    if (nameOnlyEdit) {
      try {
        await updateQrNameRequest(selectedQR.id, { qrName: trimmedName });
        const refreshedQrs = await fetchUserQrs();
        const refreshedSelected = refreshedQrs.find((item) => item.id === selectedQR.id) || null;
        setSelectedQR(refreshedSelected);
        setIsEditing(false);
        setEditActive(refreshedSelected?.active ?? selectedQR.active);

        notify("info", `"${trimmedName}" adı güncellendi.`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "QR adı güncellenemedi.";
        notify("danger", message);
        return;
      }
    }

    const details = getQrDetailsByType(editQrType, editQrTypeData);
    if (editQrType === "link" && !String((details as { url?: string }).url ?? "").trim()) {
      notify("warning", "URL zorunlu.");
      return;
    }
    if (editQrType === "wifi" && !String((details as { ssid?: string }).ssid ?? "").trim()) {
      notify("warning", "WiFi SSID zorunlu.");
      return;
    }
    if (editQrType === "mail" && !String((details as { mail?: string }).mail ?? "").trim()) {
      notify("warning", "E-posta adresi zorunlu.");
      return;
    }
    if (editQrType === "contact" && !String((details as { fullName?: string }).fullName ?? "").trim()) {
      notify("warning", "Ad Soyad zorunlu.");
      return;
    }
    if (editQrType === "text" && !String((details as { text?: string }).text ?? "").trim()) {
      notify("warning", "Metin zorunlu.");
      return;
    }
    if (editQrType === "location") {
      const latitude = String((details as { latitude?: string }).latitude ?? "").trim();
      const longitude = String((details as { longitude?: string }).longitude ?? "").trim();
      if (!latitude || !longitude) {
        notify("warning", "Enlem/Boylam zorunlu.");
        return;
      }
    }
    if (editQrType === "menu") {
      const menu = editQrTypeData.menu;
      if (!menu.businessName.trim()) {
        notify("warning", "Firma adı zorunlu.");
        return;
      }
      if (menu.urlMode === "slug" && !menu.publicSlug.trim()) {
        notify("warning", "Slug zorunlu.");
        return;
      }
    }

    try {
      const updateResponse = await updateQrRequest(selectedQR.id, {
        userId: selectedQR.userId,
        qrName: trimmedName,
        type: editQrType,
        details,
      });

      const refreshedQrs = await fetchUserQrs();
      const refreshedSelected =
        refreshedQrs.find((item) => item.imgSrc === updateResponse.imgSrc) || refreshedQrs[0] || null;

      setSelectedQR(refreshedSelected);
      setIsEditing(false);
      if (refreshedSelected) {
        setEditName(refreshedSelected.name);
        setEditActive(refreshedSelected.active);
        const refreshedType = getBackendTypeFromDetails(refreshedSelected.details);
        setEditQrType(refreshedType);
        setEditQrTypeData(mapDetailsToQrTypeData(refreshedSelected.details));
      }

      notify("warning", `"${trimmedName}" güncellendi. Güncelleme yeni bir QR oluşturur; eski QR devre dışı kalır.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod güncellenemedi.";
      notify("danger", message);
    }
  }, [editActive, editName, editQrType, editQrTypeData, fetchUserQrs, menuId, notify, selectedQR]);

  useEffect(() => {
    if (true) {
      void fetchUserQrs();
    }
  }, [fetchUserQrs]);

  useEffect(() => {
    if (mode !== "detail" || !qrId) {
      if (mode !== "detail") setSelectedQR(null);
      return;
    }
    const found = userQrs.find((item) => item.id === qrId) ?? null;
    setSelectedQR(found);
  }, [mode, qrId, userQrs]);

  useEffect(() => {
    if (!selectedQR || !isMenuQrDetails(selectedQR.details)) {
      setMenuId(null);
      setPublicUrl(null);
      return;
    }
    void (async () => {
      try {
        const profile = await getMenuByQrIdRequest(selectedQR.id);
        setMenuId(profile.menuId);
        setPublicUrl(profile.publicUrl);
      } catch {
        setMenuId(null);
        setPublicUrl(null);
      }
    })();
  }, [selectedQR]);

  const handleCreateQR = useCallback(async () => {
    if (!canCreateQr) {
      notify("warning", "QR oluşturmak için uygun bir paket gerekli.");
      return;
    }
    if (selectedQrType === "menu" && !canCreateMenu) {
      notify("warning", "Menü QR oluşturmak için PRO pakete geçmelisiniz.");
      return;
    }
    const trimmedQrName = qrName.trim();
    const details = getQrDetailsByType(selectedQrType, qrTypeData);

    if (!trimmedQrName) {
      notify("warning", "QR kod adı zorunlu.");
      return;
    }

    if (selectedQrType === "menu") {
      const menu = qrTypeData.menu;
      if (!menu.businessName.trim()) {
        notify("warning", "Firma adı zorunlu.");
        return;
      }
      if (menu.urlMode === "slug" && !menu.publicSlug.trim()) {
        notify("warning", "Slug zorunlu.");
        return;
      }
    }

    try {
      const response = await createQrRequest({
        qrName: trimmedQrName,
        type: selectedQrType,
        details,
      });
      setLatestQrResponse(response.qrResponse);

      notify("info", `"${trimmedQrName}" başarıyla oluşturuldu!`);
      setQrName("");
      setQrTypeData(createInitialQrTypeData());
      setQrColor("#000000");
      setQrBgColor("#ffffff");
      setSelectedQrType("link");
      void invalidatePackageUsage(queryClient);
      await fetchUserQrs();
      if (response.qrId != null) {
        router.push(DASHBOARD_ROUTES.qrCodeDetail(response.qrId));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod oluşturulamadı.";
      notify("danger", message);
    }
  }, [canCreateMenu, canCreateQr, fetchUserQrs, notify, qrName, qrTypeData, queryClient, router, selectedQrType]);

  return (
    <>
          {isLoading && <QRCodesSkeleton />}

          {/* ── QR Codes ── */}
          {!isLoading && mode === "list" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">QR Kodlarım</h1>
                  <p className="text-sm text-muted-foreground">{userQrs.length} QR kod oluşturuldu</p>
                </div>
                <Button variant="hero" size="sm" className="gap-2 self-start sm:self-auto" asChild>
                  <Link href={DASHBOARD_ROUTES.qrCodesNew}>
                    <Plus className="h-4 w-4" />
                    Yeni QR Kod
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4">
                {userQrs.map((qr) => (
                  <Card
                    key={qr.id}
                    className="glow-card cursor-pointer transition-colors hover:bg-accent/30"
                    onClick={() => { router.push(DASHBOARD_ROUTES.qrCodeDetail(qr.id)); }}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:h-12 sm:w-12">
                            {qr.imgSrc ? (
                              <img
                                src={`data:image/png;base64,${qr.imgSrc}`}
                                alt={`${qr.name} QR kodu`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <QrCode className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <h3 className="break-words pr-2 font-semibold text-sm leading-5">{qr.name}</h3>
                              <span className={`inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${qr.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                {qr.active ? "Aktif" : "Pasif"}
                              </span>
                            </div>
                            <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">{qr.content}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1 whitespace-nowrap"><Eye className="h-3 w-3" />{qr.scans} tarama</span>
                              <span className="flex items-center gap-1 whitespace-nowrap"><Calendar className="h-3 w-3" />{qr.created}</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] whitespace-nowrap">{qr.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 border-t border-border/60 pt-2 lg:justify-end lg:border-0 lg:pt-0" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8"><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8"><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8"><Share2 className="h-3.5 w-3.5" /></Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8"
                            onClick={() => {
                              router.push(DASHBOARD_ROUTES.qrCodeDetail(qr.id));
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive sm:h-8 sm:w-8">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>QR silinsin mi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <span className="font-medium">{qr.name}</span> QR’ını tamamen silersiniz. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void handleDeleteQr(qr)}>Sil</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── QR Detail / Edit ── */}
          {!isLoading && mode === "detail" && selectedQR && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { router.push(DASHBOARD_ROUTES.qrCodes); setIsEditing(false); }}
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {isEditing ? "QR Kod Düzenle" : selectedQR.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isEditing ? "Bilgileri güncelleyip kaydedin." : "QR kod detayları ve istatistikleri."}
                  </p>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setIsEditing(true);
                      setEditName(selectedQR.name);
                      setEditActive(selectedQR.active);
                      const backendType = getBackendTypeFromDetails(selectedQR.details);
                      setEditQrType(backendType);
                      setEditQrTypeData(mapDetailsToQrTypeData(selectedQR.details));
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Düzenle
                  </Button>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {isEditing ? (
                    <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                      <h2 className="text-sm font-medium text-foreground">QR Kod Bilgileri</h2>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">QR Kod Adı</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <QrTypeDetails
                          selectedType={editQrType}
                          data={editQrTypeData}
                          onChange={setEditQrTypeData}
                          menuExcludeId={menuId ?? undefined}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Durum</p>
                          <p className="text-xs text-muted-foreground">QR kodu aktif veya pasif yapın</p>
                        </div>
                        <Switch checked={editActive} onCheckedChange={setEditActive} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        {nameOnlyEditForUi ? (
                          <Button className="gap-2" onClick={() => void handleSaveQrEdit()}>
                            <Check className="h-4 w-4" />
                            Kaydet
                          </Button>
                        ) : hasChangesForUi ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="gap-2">
                                <Check className="h-4 w-4" />
                                Kaydet
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kaydet onayı</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Güncelleme yeni bir QR oluşturur; eski QR devre dışı kalır. Devam edilsin mi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void handleSaveQrEdit()}>
                                  Onayla
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button className="gap-2" disabled>
                            <Check className="h-4 w-4" />
                            Kaydet
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          { label: "Toplam Tarama", value: selectedQR.scans.toLocaleString(), icon: Eye },
                          { label: "Oluşturulma", value: selectedQR.created, icon: Calendar },
                          { label: "Tür", value: selectedQR.type, icon: QrCode },
                        ].map((s) => (
                          <div key={s.label} className="gradient-metric rounded-lg border border-border p-4">
                            <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
                            <p className="text-lg font-semibold text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <h2 className="text-sm font-medium text-foreground">Bilgiler</h2>
                        <div className="space-y-3">
                          {[
                            { label: "Ad", value: selectedQR.name },
                            { label: "URL / İçerik", value: selectedQR.content },
                            { label: "Tür", value: selectedQR.type },
                            { label: "Durum", value: selectedQR.active ? "Aktif" : "Pasif" },
                            { label: "Oluşturulma Tarihi", value: selectedQR.created },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="text-sm font-medium text-foreground">{row.value}</span>
                            </div>
                          ))}
                          {publicUrl && (
                            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm text-muted-foreground">Public URL</span>
                              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary text-right max-w-[60%] break-all">
                                {publicUrl}
                              </a>
                            </div>
                          )}
                          {getReadableDetailRows(selectedQR.details).map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">{row.value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {menuId != null && !isEditing && <MenuProductsPanel menuId={menuId} />}

                      <div className="rounded-lg border border-border bg-card p-6">
                        <h2 className="mb-4 text-sm font-medium text-foreground">Son 7 Günlük Taramalar</h2>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { day: "Pzt", scans: Math.floor(selectedQR.scans * 0.12) },
                              { day: "Sal", scans: Math.floor(selectedQR.scans * 0.18) },
                              { day: "Çar", scans: Math.floor(selectedQR.scans * 0.14) },
                              { day: "Per", scans: Math.floor(selectedQR.scans * 0.22) },
                              { day: "Cum", scans: Math.floor(selectedQR.scans * 0.19) },
                              { day: "Cmt", scans: Math.floor(selectedQR.scans * 0.09) },
                              { day: "Paz", scans: Math.floor(selectedQR.scans * 0.06) },
                            ]}>
                              <defs>
                                <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Area type="monotone" dataKey="scans" stroke="hsl(var(--foreground))" strokeWidth={1.5} fill="url(#detailGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-6 sticky top-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">QR Kod</h2>
                    <div className="aspect-square rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                      {selectedQR.imgSrc ? (
                        <img
                          src={`data:image/png;base64,${selectedQR.imgSrc}`}
                          alt={`${selectedQR.name} QR kodu`}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <QrCode className="h-24 w-24 text-foreground" />
                      )}
                    </div>
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durum</span>
                        <span className={`font-medium ${selectedQR.active ? "text-success" : "text-muted-foreground"}`}>
                          {selectedQR.active ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarama</span>
                        <span className="text-foreground font-medium">{selectedQR.scans.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> İndir</Button>
                      <Button variant="outline" size="sm" className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Kopyala</Button>
                      <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Paylaş</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Sil
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>QR silinsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <span className="font-medium">{selectedQR.name}</span> QR’ını tamamen silersiniz. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDeleteQr(selectedQR)}>Sil</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── QR Create ── */}
          {!isLoading && mode === "create" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push(DASHBOARD_ROUTES.qrCodes)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Yeni QR Kod Oluştur</h1>
                  <p className="text-sm text-muted-foreground">İçerik türünü seçin ve detayları doldurun.</p>
                </div>
              </div>

              <PackageUsageCard usage={packageUsage} isLoading={isPackageUsageLoading} />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* QR Type Selection */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">İçerik Türü</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {qrTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            if (type.value === "menu" && !canCreateMenu) {
                              notify("warning", "Menü QR oluşturmak için PRO pakete geçmelisiniz.");
                              return;
                            }
                            setSelectedQrType(type.value);
                          }}
                          disabled={!canCreateQr || type.value === "menu" && !canCreateMenu}
                          title={type.value === "menu" && !canCreateMenu ? "PRO paket gereklidir" : undefined}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                            selectedQrType === type.value
                              ? "border-foreground/30 bg-accent"
                              : "border-border hover:border-foreground/15 hover:bg-accent/50"
                          } ${!canCreateQr || type.value === "menu" && !canCreateMenu ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <type.icon className={`h-5 w-5 ${selectedQrType === type.value ? "text-foreground" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${selectedQrType === type.value ? "text-foreground" : "text-muted-foreground"}`}>
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Details */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                    <h2 className="text-sm font-medium text-foreground">Detaylar</h2>

                    <div className="space-y-2">
                      <Label htmlFor="qr-name" className="text-xs text-muted-foreground">QR Kod Adı</Label>
                      <Input
                        id="qr-name"
                        placeholder="Örn: Web Sitesi QR"
                        value={qrName}
                        onChange={(e) => setQrName(e.target.value)}
                        className="bg-background"
                      />
                    </div>

                    <QrTypeDetails
                      selectedType={selectedQrType}
                      data={qrTypeData}
                      onChange={setQrTypeData}
                    />
                  </div>

                  {/* Customization */}
                  <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                    <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Paintbrush className="h-4 w-4 text-muted-foreground" />
                      Özelleştirme
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">QR Rengi</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={qrColor}
                            onChange={(e) => setQrColor(e.target.value)}
                            className="h-9 w-9 rounded-md border border-border cursor-pointer bg-transparent"
                          />
                          <Input value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="bg-background font-mono text-xs" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Arka Plan Rengi</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={qrBgColor}
                            onChange={(e) => setQrBgColor(e.target.value)}
                            className="h-9 w-9 rounded-md border border-border cursor-pointer bg-transparent"
                          />
                          <Input value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="bg-background font-mono text-xs" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Tarama Takibi</p>
                        <p className="text-xs text-muted-foreground">QR kod taramalarını analitik panelde görüntüleyin</p>
                      </div>
                      <Switch checked={qrTracking} onCheckedChange={setQrTracking} />
                    </div>
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-6 sticky top-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">Önizleme</h2>

                    {/* QR Preview placeholder */}
                    <div
                      className="aspect-square rounded-lg border border-border flex items-center justify-center"
                      style={{ backgroundColor: qrBgColor }}
                    >
                      {latestQrResponse?.imgSrc ? (
                        <img
                          src={`data:image/png;base64,${latestQrResponse.imgSrc}`}
                          alt={`${latestQrResponse.qrName} QR kodu`}
                          className="h-full w-full rounded-lg object-contain p-4"
                        />
                      ) : (
                        <div className="text-center space-y-3">
                          <QrCode className="h-24 w-24 mx-auto" style={{ color: qrColor }} />
                          <p className="text-xs text-muted-foreground">QR Kod Önizlemesi</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tür</span>
                        <span className="text-foreground font-medium">
                          {qrTypes.find((t) => t.value === selectedQrType)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ad</span>
                        <span className="text-foreground font-medium">{qrName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Takip</span>
                        <span className="text-foreground font-medium">{qrTracking ? "Açık" : "Kapalı"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durum</span>
                        <span className="text-foreground font-medium">
                          {latestQrResponse?.status === "active" ? "Aktif" : "Hazır"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <Button
                        className="w-full gap-2"
                        onClick={handleCreateQR}
                      >
                        <Check className="h-4 w-4" />
                        QR Kod Oluştur
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setQrName("");
                          setQrTypeData(createInitialQrTypeData());
                          setQrColor("#000000");
                          setQrBgColor("#ffffff");
                          setSelectedQrType("link");
                          setLatestQrResponse(null);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Sıfırla
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </>
  );
};


export default DashboardQrCodesView;
