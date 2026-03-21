"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createQrRequest, getStoredUser, QrResponse, StoredUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, BarChart3, Settings, LogOut, Plus, TrendingUp,
  Eye, MousePointerClick, Globe, Smartphone, Monitor,
  User, Bell, Shield, Palette, ChevronRight, Calendar,
  Download, Share2, Trash2, Edit, Copy, ArrowUpRight, ArrowDownRight, Clock,
  Info, AlertTriangle, XCircle, X, ChevronDown, Zap,
  Link as LinkIcon, Wifi, Mail, Phone, FileText, MapPin,
  Paintbrush, RotateCcw, Check, ArrowLeft,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import {
  OverviewSkeleton, AnalyticsSkeleton, QRCodesSkeleton, CreateQRSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import {
  QrTypeDetails,
  QrTypeData,
  QrTypeValue,
} from "@/components/dashboard/qr-create/QrTypeDetails";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTokenRefresh } from "@/hooks/use-token-refresh";

// ── Fake data ──────────────────────────────────────────
const fakeQRCodes = [
  { id: 1, name: "Web Sitesi QR", url: "https://algorycode.com", scans: 1284, created: "2026-02-15", type: "URL", active: true },
  { id: 2, name: "LinkedIn Profil", url: "https://linkedin.com/in/user", scans: 856, created: "2026-02-20", type: "URL", active: true },
  { id: 3, name: "Menü QR", url: "https://menu.example.com", scans: 2341, created: "2026-01-10", type: "URL", active: true },
  { id: 4, name: "WiFi QR", url: "WIFI:T:WPA;S:MyNetwork;P:pass123;;", scans: 445, created: "2026-03-01", type: "WiFi", active: false },
];

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
  { value: "url", label: "URL / Link", icon: LinkIcon, desc: "Web sitesi veya sayfa linki" },
  { value: "wifi", label: "WiFi", icon: Wifi, desc: "WiFi ağ bilgileri" },
  { value: "email", label: "E-posta", icon: Mail, desc: "E-posta adresi ve mesaj" },
  { value: "phone", label: "Telefon", icon: Phone, desc: "Telefon numarası" },
  { value: "text", label: "Metin", icon: FileText, desc: "Serbest metin içeriği" },
  { value: "location", label: "Konum", icon: MapPin, desc: "GPS koordinatları" },
];

const createInitialQrTypeData = (): QrTypeData => ({
  url: "",
  wifi: { ssid: "", password: "", encryption: "wpa" },
  email: { to: "", subject: "", body: "" },
  phone: "",
  text: "",
  location: { lat: "", lng: "" },
});

const getQrDetailsByType = (type: QrTypeValue, data: QrTypeData) => {
  if (type === "url") return { url: data.url };
  if (type === "wifi") return data.wifi;
  if (type === "email") return data.email;
  if (type === "phone") return { phone: data.phone };
  if (type === "text") return { text: data.text };
  return data.location;
};

interface DashboardProps {
  initialUser?: StoredUser | null;
}

const Dashboard = ({ initialUser = null }: DashboardProps) => {
  const tooltipStyle = useTooltipStyle();
  const router = useRouter();
  useTokenRefresh(); // Arka planda access token süresi bitmeden refresh (şu an refresh çağrısı yorumda)
  const user = useMemo(() => initialUser || getStoredUser(), [initialUser]);
  const userInitials = useMemo(() => {
    if (!user) return "?";
    return ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  }, [user]);
  const userFullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Kullanıcı";

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Ready for API: set isLoading=true before fetch, false on response
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // When API calls are added, set isLoading=true here
    // and setIsLoading(false) in the fetch .then()/.finally()
  }, []);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [banners, setBanners] = useState<Array<{ id: string; type: "info" | "warning" | "danger"; message: string }>>([]);

  // QR Creation state
  const [selectedQrType, setSelectedQrType] = useState<QrTypeValue>("url");
  const [qrName, setQrName] = useState("");
  const [qrTypeData, setQrTypeData] = useState<QrTypeData>(() => createInitialQrTypeData());
  const [qrColor, setQrColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrTracking, setQrTracking] = useState(true);
  const [latestQrResponse, setLatestQrResponse] = useState<QrResponse | null>(null);

  // QR Detail/Edit state
  const [selectedQR, setSelectedQR] = useState<typeof fakeQRCodes[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editActive, setEditActive] = useState(true);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

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
      setQrColor("#000000");
      setQrBgColor("#ffffff");
      setSelectedQrType("url");
    } catch (error) {
      const message = error instanceof Error ? error.message : "QR kod oluşturulamadı.";
      const id = Date.now().toString();
      setBanners((prev) => [...prev, { id, type: "danger", message }]);
      setTimeout(() => removeBanner(id), 5000);
    }
  }, [qrName, qrTypeData, removeBanner, selectedQrType]);

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
          {/* Skeleton loading */}
          {isLoading && activeTab === "overview" && <OverviewSkeleton />}
          {isLoading && activeTab === "analytics" && <AnalyticsSkeleton />}
          {isLoading && activeTab === "codes" && <QRCodesSkeleton />}
          {isLoading && activeTab === "create" && <CreateQRSkeleton />}
          {isLoading && activeTab === "settings" && <OverviewSkeleton />}

          {/* ── Overview ── */}
          {!isLoading && activeTab === "overview" && (
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
          {!isLoading && activeTab === "analytics" && <AnalyticsTab />}

          {/* ── QR Codes ── */}
          {!isLoading && activeTab === "codes" && !selectedQR && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">QR Kodlarım</h1>
                  <p className="text-sm text-muted-foreground">{fakeQRCodes.length} QR kod oluşturuldu</p>
                </div>
                <Button variant="hero" size="sm" className="gap-2" onClick={() => handleTabChange("create")}>
                  <Plus className="h-4 w-4" />
                  Yeni QR Kod
                </Button>
              </div>

              <div className="grid gap-4">
                {fakeQRCodes.map((qr) => (
                  <Card
                    key={qr.id}
                    className="glow-card cursor-pointer transition-colors hover:bg-accent/30"
                    onClick={() => { setSelectedQR(qr); setIsEditing(false); }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <QrCode className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm">{qr.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${qr.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                {qr.active ? "Aktif" : "Pasif"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{qr.url}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{qr.scans} tarama</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{qr.created}</span>
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{qr.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="h-3.5 w-3.5" /></Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                            onClick={() => {
                              setSelectedQR(qr);
                              setIsEditing(true);
                              setEditName(qr.name);
                              setEditUrl(qr.url);
                              setEditActive(qr.active);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── QR Detail / Edit ── */}
          {!isLoading && activeTab === "codes" && selectedQR && (
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
                      setEditUrl(selectedQR.url);
                      setEditActive(selectedQR.active);
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
                        <Label className="text-xs text-muted-foreground">
                          {selectedQR.type === "WiFi" ? "WiFi Bilgisi" : "URL"}
                        </Label>
                        <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="bg-background" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Durum</p>
                          <p className="text-xs text-muted-foreground">QR kodu aktif veya pasif yapın</p>
                        </div>
                        <Switch checked={editActive} onCheckedChange={setEditActive} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          className="gap-2"
                          onClick={() => {
                            const id = Date.now().toString();
                            setBanners((prev) => [...prev, { id, type: "info", message: `"${editName}" başarıyla güncellendi!` }]);
                            setTimeout(() => removeBanner(id), 4000);
                            setIsEditing(false);
                          }}
                        >
                          <Check className="h-4 w-4" />
                          Kaydet
                        </Button>
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
                            { label: "URL / İçerik", value: selectedQR.url },
                            { label: "Tür", value: selectedQR.type },
                            { label: "Durum", value: selectedQR.active ? "Aktif" : "Pasif" },
                            { label: "Oluşturulma Tarihi", value: selectedQR.created },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="text-sm font-medium text-foreground">{row.value}</span>
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
                    <div className="aspect-square rounded-lg border border-border bg-background flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-foreground" />
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
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Sil</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── QR Create ── */}
          {!isLoading && activeTab === "create" && (
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {qrTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setSelectedQrType(type.value)}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                            selectedQrType === type.value
                              ? "border-foreground/30 bg-accent"
                              : "border-border hover:border-foreground/15 hover:bg-accent/50"
                          }`}
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
                          setSelectedQrType("url");
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
          {!isLoading && activeTab === "settings" && (
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
