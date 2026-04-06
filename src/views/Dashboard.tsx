"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createQrRequest, deleteQrRequest, getStoredUser, QrResponse, StoredUser, updateQrNameRequest, updateQrRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, BarChart3, Settings, LogOut, Plus, TrendingUp,
  Eye, Calendar,
  Download, Share2, Trash2, Edit, Copy, ArrowUpRight, ArrowDownRight, Clock,
  Info, AlertTriangle, XCircle, X, ChevronDown, Zap,
  Link as LinkIcon, Wifi, Mail, Phone, FileText, MapPin,
  RotateCcw, Check, ArrowLeft,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import { QRCodesSkeleton } from "@/components/dashboard/DashboardSkeletons";
import {
  QrTypeDetails,
  QrTypeData,
  QrTypeValue,
} from "@/components/dashboard/qr-create/QrTypeDetails";
import { QrTypeSelector } from "@/components/dashboard/qr-create/QrTypeSelector";
import {
  createInitialQrTypeData,
  DashboardQrItem,
  getBackendTypeFromDetails,
  getQrDetailsByType,
  getReadableDetailRows,
  mapDetailsToQrTypeData,
} from "@/components/dashboard/qr/qr-mappers";
import { buildPlatformShareUrl, copyQrImageToClipboard, copyTextToClipboard, downloadQrImage, shareQr, SharePlatform } from "@/components/dashboard/qr/qr-actions";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateUserQrs, useUserQrs, userQrsQueryKey } from "@/hooks/use-user-qrs";

const metrics = [
  { label: "Toplam Tarama", value: "4,926", change: "+12.5%", up: true, icon: Eye },
  { label: "Aktif QR Kodlar", value: "3", change: "+1", up: true, icon: QrCode },
  { label: "Bu Hafta", value: "342", change: "+8.2%", up: true, icon: TrendingUp },
  { label: "Ort. Süre", value: "2d 34s", change: "-4.1%", up: false, icon: Clock },
];

const trafficData = [
  { name: "Pzt", views: 1200, visitors: 400 },
  { name: "Sal", views: 1900, visitors: 600 },
  { name: "Çar", views: 1600, visitors: 520 },
  { name: "Per", views: 2200, visitors: 780 },
  { name: "Cum", views: 2800, visitors: 920 },
  { name: "Cmt", views: 2100, visitors: 680 },
  { name: "Paz", views: 1800, visitors: 590 },
];

const recentContent = [
  { title: "Web Sitesi QR - algorycode.com", status: "Aktif", date: "5 Mar, 2026" },
  { title: "LinkedIn Profil QR", status: "Aktif", date: "4 Mar, 2026" },
  { title: "Menü QR Kodu", status: "Aktif", date: "3 Mar, 2026" },
  { title: "WiFi QR Kodu", status: "Pasif", date: "2 Mar, 2026" },
  { title: "Kampanya QR Kodu", status: "Aktif", date: "1 Mar, 2026" },
];

function useTooltipStyle() {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return {
    backgroundColor: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isDark ? "1px solid hsl(0 0% 15%)" : "1px solid hsl(0 0% 88%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: isDark ? "hsl(0 0% 93%)" : "hsl(0 0% 10%)",
    boxShadow: isDark ? "none" : "0 2px 8px hsl(0 0% 0% / 0.08)",
  };
}

const qrTypes: Array<{ value: QrTypeValue; label: string; icon: typeof LinkIcon; desc: string }> = [
  { value: "link", label: "URL / Link", icon: LinkIcon, desc: "Web sitesi veya sayfa linki" },
  { value: "wifi", label: "WiFi", icon: Wifi, desc: "WiFi ağ bilgileri" },
  { value: "mail", label: "E-posta", icon: Mail, desc: "E-posta adresi ve mesaj" },
  { value: "contact", label: "İletişim", icon: Phone, desc: "Kişi kartı bilgileri" },
  { value: "text", label: "Metin", icon: FileText, desc: "Serbest metin içeriği" },
  { value: "location", label: "Konum", icon: MapPin, desc: "GPS koordinatları" },
];

interface DashboardProps {
  initialUser?: StoredUser | null;
}

const Dashboard = ({ initialUser = null }: DashboardProps) => {
  const tooltipStyle = useTooltipStyle();
  const router = useRouter();
  const queryClient = useQueryClient();
  useTokenRefresh(); // Arka planda access token süresi bitmeden refresh (şu an refresh çağrısı yorumda)
  const user = useMemo(() => initialUser || getStoredUser(), [initialUser]);
  const userIdStr = user?.id?.trim() || undefined;
  const {
    data: userQrs = [],
    isPending: qrsPending,
    isError: qrsError,
    error: qrsErrorObj,
  } = useUserQrs(userIdStr);

  const syncUserQrsAfterMutation = useCallback(async (): Promise<DashboardQrItem[]> => {
    const id = userIdStr?.trim();
    if (!id) return [];
    await invalidateUserQrs(queryClient, id);
    return queryClient.getQueryData<DashboardQrItem[]>(userQrsQueryKey(id)) ?? [];
  }, [queryClient, userIdStr]);
  const userInitials = useMemo(() => {
    if (!user) return "?";
    return ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  }, [user]);
  const userFullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Kullanıcı";

  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [banners, setBanners] = useState<Array<{ id: string; type: "info" | "warning" | "danger"; message: string }>>([]);

  // QR Creation state
  const [selectedQrType, setSelectedQrType] = useState<QrTypeValue>("link");
  const [qrName, setQrName] = useState("");
  const [qrTypeData, setQrTypeData] = useState<QrTypeData>(() => createInitialQrTypeData());
  const [latestQrResponse, setLatestQrResponse] = useState<QrResponse | null>(null);
  const [shareTarget, setShareTarget] = useState<DashboardQrItem | null>(null);

  // QR Detail/Edit state
  const [selectedQR, setSelectedQR] = useState<DashboardQrItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editQrType, setEditQrType] = useState<QrTypeValue>("link");
  const [editQrTypeData, setEditQrTypeData] = useState<QrTypeData>(() => createInitialQrTypeData());

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

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleDeleteQr = useCallback(async (qr: DashboardQrItem) => {
    try {
      await deleteQrRequest(qr.id);
      setSelectedQR((prev) => (prev?.id === qr.id ? null : prev));
      setIsEditing(false);
      await invalidateUserQrs(queryClient, userIdStr);

      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "info", message: `"${qr.name}" silindi.` }]);
      setTimeout(() => removeBanner(id), 4000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod silinemedi.";
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "danger", message }]);
      setTimeout(() => removeBanner(id), 5000);
    }
  }, [queryClient, removeBanner, userIdStr]);

  const showBanner = useCallback((type: "info" | "warning" | "danger", message: string, timeout = 4000) => {
    const id = Date.now().toString();
    setBanners((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeBanner(id), timeout);
  }, [removeBanner]);

  const handleCopyQr = useCallback(async (qr: DashboardQrItem) => {
    try {
      const copiedImage = await copyQrImageToClipboard(qr.imgSrc);
      if (copiedImage) {
        showBanner("info", `"${qr.name}" QR görseli panoya kopyalandı.`);
        return;
      }
      const copiedText = await copyTextToClipboard(qr.content || qr.name);
      if (copiedText) {
        showBanner("warning", "Gorsel kopyalama desteklenmedi, icerik panoya kopyalandi.");
        return;
      }
      showBanner("danger", "Kopyalama bu tarayicida desteklenmiyor.");
    } catch {
      showBanner("danger", "Kopyalama başarısız oldu.");
    }
  }, [showBanner]);

  const handleDownloadQr = useCallback((qr: DashboardQrItem) => {
    if (!qr.imgSrc) {
      showBanner("warning", "İndirilecek QR görseli bulunamadı.");
      return;
    }
    const ok = downloadQrImage(qr.imgSrc, qr.name);
    if (!ok) {
      showBanner("danger", "QR görseli indirilemedi.");
      return;
    }
    showBanner("info", `"${qr.name}" indirildi.`);
  }, [showBanner]);

  const handleShareQr = useCallback(async (qr: DashboardQrItem) => {
    try {
      const guessedUrl = qr.content.startsWith("http") ? qr.content : (typeof window !== "undefined" ? window.location.origin : undefined);
      const shared = await shareQr({
        title: qr.name,
        text: qr.content || qr.name,
        imgSrc: qr.imgSrc,
        url: guessedUrl,
      });

      if (shared) {
        showBanner("info", `"${qr.name}" paylaşım penceresi açıldı.`);
        return;
      }
      setShareTarget(qr);
      showBanner("info", "Sistem paylasimi desteklenmiyor, platform secerek paylasabilirsin.");
    } catch {
      showBanner("danger", "Paylaşım işlemi başarısız oldu.");
    }
  }, [showBanner]);

  const handlePlatformShare = useCallback((platform: SharePlatform) => {
    if (!shareTarget) return;

    const shareText = shareTarget.content || shareTarget.name;
    const shareUrl = shareTarget.content.startsWith("http")
      ? shareTarget.content
      : (typeof window !== "undefined" ? window.location.origin : "");

    const url = buildPlatformShareUrl(platform, { text: shareText, url: shareUrl });
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [shareTarget]);

  const handleUpdateQrNameOnly = useCallback(async () => {
    if (!selectedQR) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "QR kod adı zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }

    if (trimmedName === selectedQR.name) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "info", message: "Ad alanında bir değişiklik yok." }]);
      setTimeout(() => removeBanner(id), 3000);
      return;
    }

    try {
      await updateQrNameRequest(selectedQR.id, { qrName: trimmedName });
      const refreshedQrs = await syncUserQrsAfterMutation();
      const refreshedSelected = refreshedQrs.find((item) => item.id === selectedQR.id) || null;
      setSelectedQR(refreshedSelected);
      setEditName(refreshedSelected?.name ?? trimmedName);

      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "info", message: `"${trimmedName}" adı güncellendi.` }]);
      setTimeout(() => removeBanner(id), 4000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR adı güncellenemedi.";
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "danger", message }]);
      setTimeout(() => removeBanner(id), 5000);
    }
  }, [editName, removeBanner, selectedQR, syncUserQrsAfterMutation]);

  const handleSaveQrEdit = useCallback(async () => {
    if (!selectedQR) return;

    const trimmedName = editName.trim();

    if (!trimmedName) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "QR kod adı zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
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

    // Name-only edit: PATCH /qr/update-name -> yeni QR üretmez.
    if (nameOnlyEdit) {
      await handleUpdateQrNameOnly();
      setIsEditing(false);
      return;
    }

    const details = getQrDetailsByType(editQrType, editQrTypeData);
    if (editQrType === "link" && !String((details as { url?: string }).url ?? "").trim()) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "URL zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }
    if (editQrType === "wifi" && !String((details as { ssid?: string }).ssid ?? "").trim()) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "WiFi SSID zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }
    if (editQrType === "mail" && !String((details as { mail?: string }).mail ?? "").trim()) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "E-posta adresi zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }
    if (editQrType === "contact" && !String((details as { fullName?: string }).fullName ?? "").trim()) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "Ad Soyad zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }
    if (editQrType === "text" && !String((details as { text?: string }).text ?? "").trim()) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "Metin zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }
    if (editQrType === "location") {
      const latitude = String((details as { latitude?: string }).latitude ?? "").trim();
      const longitude = String((details as { longitude?: string }).longitude ?? "").trim();
      if (!latitude || !longitude) {
        const id = Date.now().toString();
        setBanners((prev) => [...prev, { id, type: "warning", message: "Enlem/Boylam zorunlu." }]);
        setTimeout(() => removeBanner(id), 4000);
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

      const refreshedQrs = await syncUserQrsAfterMutation();
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

      const id = Date.now().toString();
      setBanners((prev) => [
        ...prev,
        {
          id,
          type: "warning",
          message: `"${trimmedName}" güncellendi. Güncelleme yeni bir QR oluşturur; eski QR devre dışı kalır.`,
        },
      ]);
      setTimeout(() => removeBanner(id), 4000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod güncellenemedi.";
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "danger", message }]);
      setTimeout(() => removeBanner(id), 5000);
    }
  }, [editActive, editName, editQrType, editQrTypeData, handleUpdateQrNameOnly, removeBanner, selectedQR, syncUserQrsAfterMutation]);

  const triggerNotification = useCallback((type: "info" | "warning" | "danger") => {
    const id = Date.now().toString();
    const messages = {
      info: "Yeni bir güncelleme mevcut. Detaylar için tıklayın.",
      warning: "Disk alanınız %90 doluluk oranına ulaştı.",
      danger: "Kritik hata! Bazı QR kodlar erişilemez durumda.",
    };

    setBanners((prev) => [...prev, { id, type, message: messages[type] }]);
    setTimeout(() => removeBanner(id), 6000);
  }, [removeBanner]);

  const handleCreateQR = useCallback(async () => {
    const trimmedQrName = qrName.trim();
    const details = getQrDetailsByType(selectedQrType, qrTypeData);

    if (!trimmedQrName) {
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "warning", message: "QR kod adı zorunlu." }]);
      setTimeout(() => removeBanner(id), 4000);
      return;
    }

    try {
      const response = await createQrRequest({
        qrName: trimmedQrName,
        type: selectedQrType,
        details,
      });
      setLatestQrResponse(response.qrResponse);

      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "info", message: `"${trimmedQrName}" başarıyla oluşturuldu!` }]);
      setTimeout(() => removeBanner(id), 4000);
      setQrName("");
      setQrTypeData(createInitialQrTypeData());
      setSelectedQrType("link");
      await invalidateUserQrs(queryClient, userIdStr);
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod oluşturulamadı.";
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "danger", message }]);
      setTimeout(() => removeBanner(id), 5000);
    }
  }, [queryClient, qrName, qrTypeData, removeBanner, selectedQrType, userIdStr]);

  const bannerStyles = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    warning: "bg-warning/10 border-warning/20 text-warning",
    danger: "bg-destructive/10 border-destructive/20 text-destructive",
  };

  const bannerIcons = { info: Info, warning: AlertTriangle, danger: XCircle };

  const navItems = [
    { label: "Genel Bakış", icon: BarChart3, value: "overview" },
    { label: "Analitik", icon: TrendingUp, value: "analytics" },
    { label: "QR Kodlarım", icon: QrCode, value: "codes" },
    { label: "QR Oluştur", icon: Plus, value: "create" },
    { label: "Ayarlar", icon: Settings, value: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 p-6 gap-6">
        <Link href="/" className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-foreground" />
          <span className="text-lg font-bold">
            Algory<span className="text-muted-foreground">QR</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}

          <div className="my-2 border-t border-border" />

          {/* Bildirim Tetikle collapsible */}
          <Collapsible open={notifyOpen} onOpenChange={setNotifyOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <span className="flex items-center gap-3">
                  <Zap className="h-4 w-4" />
                  Bildirim Tetikle
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${notifyOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-2 space-y-1.5 pt-1.5">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-blue-500 hover:bg-blue-500/10" onClick={() => triggerNotification("info")}>
                <Info className="h-3.5 w-3.5" /> Info
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-warning hover:bg-warning/10" onClick={() => triggerNotification("warning")}>
                <AlertTriangle className="h-3.5 w-3.5" /> Warning
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10" onClick={() => triggerNotification("danger")}>
                <XCircle className="h-3.5 w-3.5" /> Danger
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </nav>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={async () => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("algory_user");
              }
              await axios.post("/api/auth/logout", undefined, { withCredentials: true }).catch(() => undefined);
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {/* Top banner notifications */}
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
          <AnimatePresence>
            {banners.map((banner) => {
              const BannerIcon = bannerIcons[banner.type];
              return (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: -60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`pointer-events-auto mt-3 mx-4 w-full max-w-lg rounded-lg border px-4 py-3 flex items-center gap-3 shadow-lg backdrop-blur-sm ${bannerStyles[banner.type]}`}
                >
                  <BannerIcon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium flex-1">{banner.message}</span>
                  <button onClick={() => removeBanner(banner.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AlertDialog open={!!shareTarget} onOpenChange={(open) => { if (!open) setShareTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Paylasim Platformu Sec</AlertDialogTitle>
              <AlertDialogDescription>
                WhatsApp, Facebook, X, Telegram veya LinkedIn ile paylasabilirsin. Instagram web uzerinden direkt paylasim vermez.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handlePlatformShare("whatsapp")}>WhatsApp</Button>
              <Button variant="outline" onClick={() => handlePlatformShare("facebook")}>Facebook</Button>
              <Button variant="outline" onClick={() => handlePlatformShare("x")}>X</Button>
              <Button variant="outline" onClick={() => handlePlatformShare("telegram")}>Telegram</Button>
              <Button variant="outline" onClick={() => handlePlatformShare("linkedin")} className="col-span-2">LinkedIn</Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Kapat</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50">
          <Link href="/" className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-foreground" />
            <span className="text-base font-bold">
              Algory<span className="text-muted-foreground">QR</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden border-b border-border overflow-x-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full rounded-none bg-transparent border-0 h-auto p-0">
              {[
                { label: "Genel", value: "overview" },
                { label: "Analitik", value: "analytics" },
                { label: "QR Kodlar", value: "codes" },
                { label: "Oluştur", value: "create" },
                { label: "Ayarlar", value: "settings" },
              ].map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs sm:text-sm"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop top navbar */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-8 py-3 border-b border-border bg-card/50">
          <ThemeToggle />
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground leading-none">{userFullName}</p>
              {user?.email && <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>}
            </div>
            <button
              onClick={() => handleTabChange("settings")}
              className="h-9 w-9 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-semibold text-primary-foreground">{userInitials}</span>
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {activeTab === "codes" && !selectedQR && qrsPending && <QRCodesSkeleton />}

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Genel Bakış</h1>
                  <p className="text-sm text-muted-foreground">QR kodlarınızın özeti.</p>
                </div>
                <Button variant="hero" size="sm" className="gap-2" onClick={() => handleTabChange("create")}>
                  <Plus className="h-4 w-4" />
                  Yeni QR Kod
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((m) => (
                  <Card key={m.label} className="glow-card transition-colors hover:bg-accent/30">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <m.icon className="h-4 w-4 text-muted-foreground" />
                        <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? "text-success" : "text-destructive"}`}>
                          {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {m.change}
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="glow-card">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-sm font-medium text-foreground">Trafik</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="views" stroke="hsl(var(--foreground))" strokeWidth={1.5} fill="url(#viewsGrad)" />
                        <Area type="monotone" dataKey="visitors" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glow-card">
                <div className="border-b border-border px-6 py-4">
                  <h2 className="text-sm font-medium text-foreground">Son İçerikler</h2>
                </div>
                <div className="divide-y divide-border">
                  {recentContent.map((item) => (
                    <div key={item.title} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-accent/50">
                      <span className="text-sm text-foreground">{item.title}</span>
                      <div className="flex items-center gap-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "Aktif" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && <AnalyticsTab />}

          {/* ── QR Codes (liste) ── */}
          {activeTab === "codes" && !selectedQR && !qrsPending && qrsError && (
            <div className="space-y-4 animate-fade-in rounded-lg border border-destructive/20 bg-destructive/5 p-6">
              <h1 className="text-xl font-semibold text-foreground">QR Kodlarım</h1>
              <p className="text-sm text-destructive">
                {qrsErrorObj instanceof Error ? qrsErrorObj.message : "QR kodlar yüklenemedi."}
              </p>
              {userIdStr && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void queryClient.invalidateQueries({ queryKey: userQrsQueryKey(userIdStr) })}
                >
                  Tekrar dene
                </Button>
              )}
            </div>
          )}

          {activeTab === "codes" && !selectedQR && !qrsPending && !qrsError && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">QR Kodlarım</h1>
                  <p className="text-sm text-muted-foreground">{userQrs.length} QR kod oluşturuldu</p>
                </div>
                <Button variant="hero" size="sm" className="gap-2 self-start sm:self-auto" onClick={() => handleTabChange("create")}>
                  <Plus className="h-4 w-4" />
                  Yeni QR Kod
                </Button>
              </div>

              <div className="grid gap-4">
                {userQrs.map((qr) => (
                  <Card
                    key={qr.id}
                    className="glow-card cursor-pointer transition-colors hover:bg-accent/30"
                    onClick={() => { setSelectedQR(qr); setIsEditing(false); }}
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8" onClick={() => void handleCopyQr(qr)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8" onClick={() => handleDownloadQr(qr)}><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8" onClick={() => void handleShareQr(qr)}><Share2 className="h-3.5 w-3.5" /></Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8"
                            onClick={() => {
                              setSelectedQR(qr);
                              setIsEditing(true);
                              setEditName(qr.name);
                              setEditActive(qr.active);
                              const backendType = getBackendTypeFromDetails(qr.details);
                              setEditQrType(backendType);
                              setEditQrTypeData(mapDetailsToQrTypeData(qr.details));
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
          {activeTab === "codes" && selectedQR && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedQR(null); setIsEditing(false); }}
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
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-background" />
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => void handleUpdateQrNameOnly()}
                          >
                            Adı Güncelle
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <QrTypeDetails selectedType={editQrType} data={editQrTypeData} onChange={setEditQrTypeData} />
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
                          {getReadableDetailRows(selectedQR.details).map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">{row.value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

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
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownloadQr(selectedQR)}><Download className="h-3.5 w-3.5" /> İndir</Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleCopyQr(selectedQR)}><Copy className="h-3.5 w-3.5" /> Kopyala</Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleShareQr(selectedQR)}><Share2 className="h-3.5 w-3.5" /> Paylaş</Button>
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
          {activeTab === "create" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <button onClick={() => handleTabChange("codes")} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Yeni QR Kod Oluştur</h1>
                  <p className="text-sm text-muted-foreground">İçerik türünü seçin ve detayları doldurun.</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* QR Type Selection */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">İçerik Türü</h2>
                    <QrTypeSelector value={selectedQrType} options={qrTypes} onChange={setSelectedQrType} />
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

                </div>

                {/* Right: Preview */}
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-6 sticky top-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">Önizleme</h2>

                    {/* QR Preview placeholder */}
                    <div className="aspect-square rounded-lg border border-border flex items-center justify-center">
                      {latestQrResponse?.imgSrc ? (
                        <img
                          src={`data:image/png;base64,${latestQrResponse.imgSrc}`}
                          alt={`${latestQrResponse.qrName} QR kodu`}
                          className="h-full w-full rounded-lg object-contain p-4"
                        />
                      ) : (
                        <div className="text-center space-y-3">
                          <QrCode className="h-24 w-24 mx-auto" />
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

          {/* ── Settings ── */}
          {activeTab === "settings" && (
            <SettingsTab onNotify={(type, message) => {
              const id = Date.now().toString();
              setBanners((prev) => [...prev, { id, type, message }]);
              setTimeout(() => removeBanner(id), 4000);
            }} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
