"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Shield, Bell, Palette, Globe, ChevronRight, ArrowLeft,
  Check, Camera, Key, Lock, Smartphone, Mail, Sun, Moon, Languages, Monitor,
  Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, LogOut, Timer,
} from "lucide-react";
import { REFRESH_AFTER_LOGIN_MS } from "@/lib/config";

const NEXT_REFRESH_AT_KEY = "algory_next_refresh_at";

type SettingsPage = "main" | "profile" | "security" | "notifications" | "appearance" | "api" | "session";

interface SettingsTabProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

function formatCountdown(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const sec = Math.max(0, expiresAt - now);
  if (sec === 0) return "Süre doldu";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h >= 24) {
      const d = Math.floor(h / 24);
      const hh = h % 24;
      return `${d} gün ${hh} sa ${mm} dk ${s} sn`;
    }
    return `${h} sa ${mm} dk ${s} sn`;
  }
  return `${m} dk ${s} sn`;
}

/** Kalan ms için "X dk Y sn sonra" metni */
function formatRefreshIn(remainingMs: number): string {
  const sec = Math.max(0, Math.ceil(remainingMs / 1000));
  if (sec === 0) return "şimdi gönderilecek";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} dk ${s} sn sonra`;
}

export default function SettingsTab({ onNotify }: SettingsTabProps) {
  const router = useRouter();
  const [page, setPage] = useState<SettingsPage>("main");

  // Token / session state (session sayfası için)
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(null);
  const [refreshTokenExpiresAt, setRefreshTokenExpiresAt] = useState<number | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>("—");
  const [refreshCountdownLabel, setRefreshCountdownLabel] = useState<string>("—");
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const [nextRefreshInLabel, setNextRefreshInLabel] = useState<string>("—");
  const refreshTriggeredRef = useRef(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState("Ahmet");
  const [lastName, setLastName] = useState("Yılmaz");
  const [email, setEmail] = useState("ahmet@algorycode.com");
  const [phone, setPhone] = useState("+90 555 123 4567");
  const [bio, setBio] = useState("QR kod tutkunu, dijital pazarlamacı.");

  // Security state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionAlerts, setSessionAlerts] = useState(true);

  // Notification state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Appearance state
  const [language, setLanguage] = useState("tr");

  // API state
  const [showApiKey, setShowApiKey] = useState(false);
  const fakeApiKey = "aqr_live_k8x2mN9pRtL4vQ7wBcD3fH6jK0sU1yZ";

  const fetchTokenExp = useCallback(() => {
    setTokenLoading(true);
    axios
      .get<{ accessTokenExpiresAt: number | null; refreshTokenExpiresAt: number | null }>("/api/auth/token-exp", { withCredentials: true })
      .then((res) => {
        const accessExp = res.data?.accessTokenExpiresAt ?? null;
        const refreshExp = res.data?.refreshTokenExpiresAt ?? null;
        setAccessTokenExpiresAt(accessExp);
        setRefreshTokenExpiresAt(refreshExp);
        setCountdownLabel(accessExp != null ? formatCountdown(accessExp) : "—");
        setRefreshCountdownLabel(refreshExp != null ? formatCountdown(refreshExp) : "—");
        if (accessExp != null) {
          const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(NEXT_REFRESH_AT_KEY) : null;
          const storedAt = stored ? parseInt(stored, 10) : NaN;
          const useStored = !isNaN(storedAt) && storedAt > Date.now();
          const at = useStored ? storedAt : Date.now() + REFRESH_AFTER_LOGIN_MS;
          if (!useStored && typeof sessionStorage !== "undefined") sessionStorage.setItem(NEXT_REFRESH_AT_KEY, String(at));
          setNextRefreshAt(at);
        }
      })
      .catch(() => {
        setCountdownLabel("—");
        setRefreshCountdownLabel("—");
      })
      .finally(() => setTokenLoading(false));
  }, []);

  useEffect(() => {
    if (page === "session") fetchTokenExp();
  }, [page, fetchTokenExp]);

  useEffect(() => {
    if (accessTokenExpiresAt == null || accessTokenExpiresAt <= 0) return;
    const update = () => setCountdownLabel(formatCountdown(accessTokenExpiresAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [accessTokenExpiresAt]);

  useEffect(() => {
    if (refreshTokenExpiresAt == null || refreshTokenExpiresAt <= 0) return;
    const update = () => setRefreshCountdownLabel(formatCountdown(refreshTokenExpiresAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [refreshTokenExpiresAt]);

  useEffect(() => {
    if (nextRefreshAt == null) {
      setNextRefreshInLabel("—");
      return;
    }
    const update = () => {
      const remaining = nextRefreshAt - Date.now();
      setNextRefreshInLabel(formatRefreshIn(remaining));
      if (remaining <= 0 && !refreshTriggeredRef.current) {
        refreshTriggeredRef.current = true;
        setNextRefreshAt(null);
        axios
          .post<{ accessTokenExpiresAt?: number }>("/api/auth/refresh", {}, { withCredentials: true })
          .then((res) => {
            const exp = res.data?.accessTokenExpiresAt;
            if (exp != null) setAccessTokenExpiresAt(exp);
            onNotify("info", "Token otomatik yenilendi.");
            fetchTokenExp();
            const nextAt = Date.now() + REFRESH_AFTER_LOGIN_MS;
            setNextRefreshAt(nextAt);
            if (typeof sessionStorage !== "undefined") sessionStorage.setItem(NEXT_REFRESH_AT_KEY, String(nextAt));
          })
          .catch((err: { response?: { status?: number } }) => {
            if (err.response?.status === 401) {
              onNotify("warning", "Oturum sonlandı. Tekrar giriş yapın.");
              router.push("/login");
              router.refresh();
            }
          })
          .finally(() => {
            refreshTriggeredRef.current = false;
          });
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextRefreshAt, onNotify, router, fetchTokenExp]);

  const handleRevoke = () => {
    setRevokeLoading(true);
    axios
      .post("/api/auth/revoke", {}, { withCredentials: true })
      .then(() => {
        onNotify("info", "Refresh token iptal edildi.");
      })
      .catch(() => {
        onNotify("danger", "İptal isteği başarısız.");
      })
      .finally(() => setRevokeLoading(false));
  };

  const handleRefreshAccess = () => {
    setRefreshLoading(true);
    axios
      .post<{ accessTokenExpiresAt?: number }>("/api/auth/refresh", {}, { withCredentials: true })
      .then((res) => {
        const exp = res.data?.accessTokenExpiresAt;
        if (exp != null) setAccessTokenExpiresAt(exp);
        onNotify("info", "Access token yenilendi.");
        fetchTokenExp();
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 401) {
          onNotify("warning", "Oturum sonlandı. Tekrar giriş yapın.");
          router.push("/login");
          router.refresh();
        } else {
          onNotify("danger", "Token yenilenemedi.");
        }
      })
      .finally(() => setRefreshLoading(false));
  };

  const backButton = (
    <button
      onClick={() => setPage("main")}
      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );

  if (page === "main") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ayarlar</h1>
          <p className="text-sm text-muted-foreground">Hesap ve uygulama ayarlarınızı yönetin</p>
        </div>
        <div className="grid gap-4">
          {[
            { icon: Key, title: "Oturum / Token", desc: "Access token kalan süre, yenileme ve revoke", key: "session" as SettingsPage },
            { icon: User, title: "Profil Bilgileri", desc: "Ad, soyad, e-posta ve telefon bilgilerinizi güncelleyin", key: "profile" as SettingsPage },
            { icon: Shield, title: "Güvenlik", desc: "Şifre değiştirme ve iki faktörlü doğrulama", key: "security" as SettingsPage },
            { icon: Bell, title: "Bildirimler", desc: "E-posta ve anlık bildirim tercihlerinizi yönetin", key: "notifications" as SettingsPage },
            { icon: Palette, title: "Görünüm", desc: "Tema ve dil tercihlerinizi ayarlayın", key: "appearance" as SettingsPage },
            { icon: Globe, title: "API Anahtarları", desc: "Entegrasyon için API anahtarlarınızı yönetin", key: "api" as SettingsPage },
          ].map((item) => (
            <Card
              key={item.title}
              className="glow-card cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setPage(item.key)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (page === "session") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Oturum / Token</h1>
            <p className="text-sm text-muted-foreground">Access token kalan süre, yenileme ve revoke (refresh token iptali)</p>
          </div>
        </div>

        <Card className="glow-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Timer className="h-4 w-4" />
                Access token kalan süre
              </div>
              <p className="text-2xl font-mono font-semibold tabular-nums">
                {tokenLoading ? "Yükleniyor…" : countdownLabel}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Timer className="h-4 w-4" />
                Refresh token kalan süre
              </div>
              <p className="text-2xl font-mono font-semibold tabular-nums">
                {tokenLoading ? "Yükleniyor…" : refreshCountdownLabel}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <RefreshCw className="h-4 w-4" />
                Yenileme isteği (2 dk sonra otomatik gönderilir)
              </div>
              <p className="text-xl font-mono font-semibold tabular-nums text-foreground">
                {tokenLoading ? "—" : nextRefreshInLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                onClick={handleRefreshAccess}
                disabled={refreshLoading || tokenLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshLoading ? "animate-spin" : ""}`} />
                {refreshLoading ? "Yenileniyor…" : "Refresh access"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={revokeLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {revokeLoading ? "İptal ediliyor…" : "Revoke"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Revoke: refresh token iptal edilir, bir daha access token alınamaz (401).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (page === "profile") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profil Bilgileri</h1>
            <p className="text-sm text-muted-foreground">Kişisel bilgilerinizi güncelleyin.</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {firstName[0]}{lastName[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-foreground">{firstName} {lastName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Üyelik: Şubat 2026</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ad</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Soyad</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">E-posta</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Hakkında</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-background resize-none" rows={3} />
          </div>
          <Button className="gap-2" onClick={() => onNotify("info", "Profil bilgileriniz güncellendi!")}>
            <Check className="h-4 w-4" /> Kaydet
          </Button>
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <h3 className="text-sm font-medium text-destructive">Tehlikeli Bölge</h3>
          <p className="text-xs text-muted-foreground">Hesabınızı silmek geri alınamaz. Tüm verileriniz kalıcı olarak silinir.</p>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
            Hesabı Sil
          </Button>
        </div>
      </div>
    );
  }

  if (page === "security") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Güvenlik</h1>
            <p className="text-sm text-muted-foreground">Şifre ve güvenlik ayarlarınızı yönetin.</p>
          </div>
        </div>

        {/* Password change */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Şifre Değiştir
          </h2>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mevcut Şifre</Label>
            <div className="relative">
              <Input type={showCurrentPass ? "text" : "password"} placeholder="••••••••" className="bg-background pr-10" />
              <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Yeni Şifre</Label>
            <div className="relative">
              <Input type={showNewPass ? "text" : "password"} placeholder="••••••••" className="bg-background pr-10" />
              <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
            <Input type="password" placeholder="••••••••" className="bg-background" />
          </div>
          <Button className="gap-2" onClick={() => onNotify("info", "Şifreniz başarıyla değiştirildi!")}>
            <Key className="h-4 w-4" /> Şifreyi Güncelle
          </Button>
        </div>

        {/* 2FA */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" /> İki Faktörlü Doğrulama
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">2FA</p>
              <p className="text-xs text-muted-foreground">Giriş yaparken ek güvenlik katmanı ekleyin</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Oturum Uyarıları</p>
              <p className="text-xs text-muted-foreground">Yeni cihazdan giriş yapıldığında bildirim alın</p>
            </div>
            <Switch checked={sessionAlerts} onCheckedChange={setSessionAlerts} />
          </div>
        </div>

        {/* Active sessions */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Aktif Oturumlar</h2>
          {[
            { device: "Chrome / macOS", location: "İstanbul, TR", current: true },
            { device: "Safari / iPhone", location: "İstanbul, TR", current: false },
            { device: "Firefox / Windows", location: "Ankara, TR", current: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-foreground">{s.device}</p>
                <p className="text-xs text-muted-foreground">{s.location}</p>
              </div>
              {s.current ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Bu cihaz</span>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs text-destructive h-7">Sonlandır</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "notifications") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bildirimler</h1>
            <p className="text-sm text-muted-foreground">Bildirim tercihlerinizi yönetin.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> E-posta Bildirimleri
          </h2>
          {[
            { label: "E-posta Bildirimleri", desc: "Önemli güncellemeler için e-posta alın", state: emailNotifs, set: setEmailNotifs },
            { label: "Tarama Uyarıları", desc: "QR kodlarınız tarandığında bildirim alın", state: scanAlerts, set: setScanAlerts },
            { label: "Haftalık Rapor", desc: "Her pazartesi performans özeti alın", state: weeklyReport, set: setWeeklyReport },
            { label: "Pazarlama E-postaları", desc: "Yeni özellikler ve kampanyalar hakkında bilgi alın", state: marketingEmails, set: setMarketingEmails },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.state} onCheckedChange={item.set} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" /> Anlık Bildirimler
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Push Bildirimleri</p>
              <p className="text-xs text-muted-foreground">Tarayıcı üzerinden anlık bildirim alın</p>
            </div>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
          </div>
        </div>

        <Button className="gap-2" onClick={() => onNotify("info", "Bildirim tercihleri kaydedildi!")}>
          <Check className="h-4 w-4" /> Kaydet
        </Button>
      </div>
    );
  }

  if (page === "appearance") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Görünüm</h1>
            <p className="text-sm text-muted-foreground">Tema ve dil tercihlerinizi ayarlayın.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" /> Tema
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Açık", icon: Sun, value: "light" },
              { label: "Koyu", icon: Moon, value: "dark" },
              { label: "Sistem", icon: Monitor, value: "system" },
            ].map((t) => (
              <button
                key={t.value}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <t.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" /> Dil
          </h2>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={() => onNotify("info", "Görünüm ayarları kaydedildi!")}>
          <Check className="h-4 w-4" /> Kaydet
        </Button>
      </div>
    );
  }

  // API Keys page
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        {backButton}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">API Anahtarları</h1>
          <p className="text-sm text-muted-foreground">Entegrasyon için API anahtarlarınızı yönetin.</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Canlı API Anahtarı</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Aktif</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={showApiKey ? fakeApiKey : "aqr_live_••••••••••••••••••••••••••"}
            className="bg-background font-mono text-xs"
          />
          <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => onNotify("info", "API anahtarı kopyalandı!")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Oluşturulma: 15 Şubat 2026 • Son kullanım: 2 saat önce</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-foreground">Webhook URL'leri</h2>
        {[
          { url: "https://myapp.com/webhooks/qr-scan", events: "Tarama" },
          { url: "https://myapp.com/webhooks/qr-created", events: "Oluşturma" },
        ].map((wh) => (
          <div key={wh.url} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-mono text-foreground">{wh.url}</p>
              <p className="text-xs text-muted-foreground">{wh.events} olayları</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Webhook Ekle
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-medium text-foreground">Kullanım Limitleri</h2>
        <div className="space-y-3">
          {[
            { label: "API İstekleri", used: 2340, total: 10000 },
            { label: "QR Oluşturma", used: 42, total: 100 },
            { label: "Webhook Çağrıları", used: 892, total: 5000 },
          ].map((limit) => (
            <div key={limit.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{limit.label}</span>
                <span className="text-muted-foreground">{limit.used.toLocaleString()} / {limit.total.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent">
                <div
                  className="h-1.5 rounded-full bg-foreground/30"
                  style={{ width: `${(limit.used / limit.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={() => onNotify("warning", "API anahtarı yeniden oluşturulacak. Mevcut anahtar geçersiz olacak!")}>
          <RefreshCw className="h-4 w-4" /> Anahtarı Yenile
        </Button>
      </div>
    </div>
  );
}
