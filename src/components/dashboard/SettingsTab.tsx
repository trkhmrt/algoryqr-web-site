"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateMyProfile, useMyProfile } from "@/hooks/use-my-profile";
import { getJsonErrorText } from "@/lib/api-error-text";
import {
  User, Shield, Bell, Palette, Globe, ChevronRight, ArrowLeft,
  Check, Camera, Key, Lock, Smartphone, Mail, Sun, Moon, Languages,
  Eye, EyeOff, RefreshCw, LogOut, Timer, Copy,
} from "lucide-react";
import { REFRESH_AFTER_LOGIN_MS } from "@/lib/config";
import { authService, type TwoFactorSetupPayload } from "@/lib/auth-service";
import { copyTextToClipboard } from "@/components/dashboard/qr/qr-actions";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/hooks/use-theme";

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

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

function ComingSoonBadge() {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
      Çok yakında
    </span>
  );
}

export default function SettingsTab({ onNotify }: SettingsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: myProfile, isLoading: myProfileLoading, isError: myProfileError } = useMyProfile();
  const { theme, setTheme } = useTheme();
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

  // Profile state (sunucudan doldurulur)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Security state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState("");
  const [newPasswordForChange, setNewPasswordForChange] = useState("");
  const [confirmPasswordForChange, setConfirmPasswordForChange] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const twoFactorEnabled = myProfile?.twoFactorEnabled ?? false;
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupPayload | null>(null);
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false);
  const [twoFactorActivateLoading, setTwoFactorActivateLoading] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [twoFactorDisableLoading, setTwoFactorDisableLoading] = useState(false);

  // Notification state
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [scanAlerts, setScanAlerts] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pushBrowser, setPushBrowser] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  // Appearance state
  const [language, setLanguage] = useState("tr");

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
    if (page !== "profile" || !myProfile) return;
    setFirstName(myProfile.firstName ?? "");
    setLastName(myProfile.lastName ?? "");
    setEmail(myProfile.email ?? "");
    setPhone(myProfile.phoneNumber ?? "");
  }, [page, myProfile]);

  useEffect(() => {
    if (page !== "notifications" || !myProfile) return;
    setEmailNotifs(myProfile.notifyEmailImportant);
    setScanAlerts(myProfile.notifyScanAlerts);
    setWeeklyReport(myProfile.notifyWeeklyReport);
    setMarketingEmails(myProfile.notifyMarketingEmails);
    setPushBrowser(myProfile.notifyPushBrowser);
  }, [page, myProfile]);

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

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await axios.patch(
        "/api/account/myprofile",
        { firstName, lastName, email, phoneNumber: phone },
        { withCredentials: true }
      );
      await invalidateMyProfile(queryClient);
      onNotify("info", "Profil bilgileriniz güncellendi.");
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      onNotify("danger", err.response?.data?.message ?? "Profil kaydedilemedi.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);
    try {
      await axios.patch(
        "/api/account/myprofile",
        {
          notifyEmailImportant: emailNotifs,
          notifyScanAlerts: scanAlerts,
          notifyWeeklyReport: weeklyReport,
          notifyMarketingEmails: marketingEmails,
          notifyPushBrowser: pushBrowser,
        },
        { withCredentials: true }
      );
      await invalidateMyProfile(queryClient);
      onNotify("info", "Bildirim tercihleri kaydedildi.");
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      onNotify("danger", err.response?.data?.message ?? "Tercihler kaydedilemedi.");
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const cur = currentPasswordForChange;
    const next = newPasswordForChange;
    const again = confirmPasswordForChange;
    if (!cur || !next || !again) {
      onNotify("warning", "Tüm şifre alanlarını doldurun.");
      return;
    }
    if (next.length < 8) {
      onNotify("warning", "Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    if (next !== again) {
      onNotify("warning", "Yeni şifre ile tekrarı eşleşmiyor.");
      return;
    }
    setPasswordChangeLoading(true);
    try {
      await axios.post(
        "/api/account/change-password",
        { currentPassword: cur, newPassword: next },
        { withCredentials: true }
      );
      setCurrentPasswordForChange("");
      setNewPasswordForChange("");
      setConfirmPasswordForChange("");
      onNotify("info", "Şifreniz güncellendi.");
    } catch (e) {
      const err = e as { response?: { data?: unknown } };
      onNotify("danger", getJsonErrorText(err.response?.data) || "Şifre güncellenemedi.");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const clearTwoFactorQr = () => {
    setTwoFactorSetup(null);
    setTotpCode("");
  };

  const handleCopyTwoFactorSecret = async () => {
    if (!twoFactorSetup) return;
    const ok = await copyTextToClipboard(twoFactorSetup.secret);
    if (ok) onNotify("info", "Gizli anahtar panoya kopyalandı.");
    else onNotify("warning", "Kopyalama başarısız.");
  };

  const handleStartTwoFactorSetup = async () => {
    setTwoFactorSetupLoading(true);
    try {
      const payload = await authService.fetchTwoFactorSetup();
      setTwoFactorSetup(payload);
      setTotpCode("");
      onNotify("info", "Kurulum hazır. QR veya gizli anahtar ile uygulamaya ekleyin; sonra kodu girin.");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Kurulum bilgisi alınamadı.";
      onNotify("danger", msg);
    } finally {
      setTwoFactorSetupLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    const code = totpDisableCode.trim();
    if (!/^\d{6}$/.test(code)) {
      onNotify("warning", "Kapatmak için 6 haneli kodu girin.");
      return;
    }
    setTwoFactorDisableLoading(true);
    try {
      await authService.disableTwoFactor(code);
      setTotpDisableCode("");
      await invalidateMyProfile(queryClient);
      onNotify("info", "İki adımlı doğrulama kapatıldı.");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "2FA kapatılamadı.";
      onNotify("danger", msg);
    } finally {
      setTwoFactorDisableLoading(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    const code = totpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      onNotify("warning", "Authenticator’daki 6 haneli kodu girin.");
      return;
    }
    setTwoFactorActivateLoading(true);
    try {
      await authService.activateTwoFactor(code);
      clearTwoFactorQr();
      await invalidateMyProfile(queryClient);
      onNotify("info", "İki adımlı doğrulama etkinleştirildi.");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Kod doğrulanamadı.";
      onNotify("danger", msg);
    } finally {
      setTwoFactorActivateLoading(false);
    }
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
    const avA = (firstName.trim() || myProfile?.firstName || "?").charAt(0).toUpperCase();
    const avB = (lastName.trim() || myProfile?.lastName || "").charAt(0).toUpperCase();
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {backButton}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profil Bilgileri</h1>
            <p className="text-sm text-muted-foreground">Kişisel bilgilerinizi güncelleyin.</p>
          </div>
        </div>

        {myProfileError ? (
          <p className="text-sm text-destructive">Profil yüklenemedi. Oturumunuzu kontrol edin.</p>
        ) : null}

        {/* Avatar */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {myProfileLoading ? "…" : `${avA}${avB || ""}`}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors opacity-50 cursor-not-allowed"
                disabled
                aria-label="Fotoğraf (yakında)"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {myProfileLoading ? "Yükleniyor…" : `${firstName || myProfile?.firstName || ""} ${lastName || myProfile?.lastName || ""}`.trim() || "—"}
              </p>
              <p className="text-xs text-muted-foreground">{email || myProfile?.email || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Üyelik: {formatMemberSince(myProfile?.memberSince)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ad</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background"
                disabled={myProfileLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Soyad</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background"
                disabled={myProfileLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">E-posta</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
              disabled={myProfileLoading}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Telefon</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-background"
              disabled={myProfileLoading}
            />
          </div>
          <Button className="gap-2" onClick={handleSaveProfile} disabled={profileSaving || myProfileLoading || myProfileError}>
            <Check className="h-4 w-4" /> {profileSaving ? "Kaydediliyor…" : "Kaydet"}
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
              <Input
                type={showCurrentPass ? "text" : "password"}
                placeholder="••••••••"
                className="bg-background pr-10"
                value={currentPasswordForChange}
                onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Yeni Şifre</Label>
            <div className="relative">
              <Input
                type={showNewPass ? "text" : "password"}
                placeholder="En az 8 karakter"
                className="bg-background pr-10"
                value={newPasswordForChange}
                onChange={(e) => setNewPasswordForChange(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-background"
              value={confirmPasswordForChange}
              onChange={(e) => setConfirmPasswordForChange(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button className="gap-2" onClick={handleChangePassword} disabled={passwordChangeLoading}>
            <Key className="h-4 w-4" /> {passwordChangeLoading ? "Güncelleniyor…" : "Şifreyi Güncelle"}
          </Button>
        </div>

        {/* 2FA */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" /> İki Faktörlü Doğrulama
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground">Authenticator (TOTP)</p>
              <p className="text-xs text-muted-foreground">
                İki yol: başka cihazda QR taratın veya aynı telefonda aşağıdaki gizli anahtarı Authenticator’da “Kurulum anahtarını gir” ile ekleyin. Sonra üretilen 6 haneli kodu yazıp etkinleştirin.
              </p>
            </div>
            {myProfileLoading ? (
              <p className="text-sm text-muted-foreground">Güvenlik bilgisi yükleniyor…</p>
            ) : twoFactorEnabled ? (
              <div className="space-y-3 max-w-sm">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">2FA hesabınızda açık.</p>
                <p className="text-xs text-muted-foreground">
                  Kapatmak için Authenticator&apos;dan güncel 6 haneli kodu girin.
                </p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Doğrulama kodu</Label>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="bg-background tracking-widest font-mono"
                    value={totpDisableCode}
                    onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={twoFactorDisableLoading || totpDisableCode.length !== 6}
                  onClick={handleDisableTwoFactor}
                >
                  {twoFactorDisableLoading ? "Kapatılıyor…" : "2FA'yı kapat"}
                </Button>
              </div>
            ) : !twoFactorSetup ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={twoFactorSetupLoading}
                onClick={handleStartTwoFactorSetup}
              >
                <Smartphone className="h-4 w-4" />
                {twoFactorSetupLoading ? "Hazırlanıyor…" : "Kurulumu başlat (QR + anahtar)"}
              </Button>
            ) : (
              <div className="space-y-4 max-w-md">
                <p className="text-xs text-muted-foreground">
                  Uygulamaya ekledikten sonra aşağıya güncel 6 haneli kodu yazın.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${twoFactorSetup.qrImageBase64}`}
                  alt="İki adımlı doğrulama QR"
                  width={200}
                  height={200}
                  className="rounded-md border border-border bg-white p-2"
                />
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">Tek telefonda (QR taratmadan)</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Google Authenticator / Microsoft Authenticator: <span className="text-foreground">+</span> →{" "}
                    <span className="text-foreground">Kurulum anahtarını gir</span> → hesap adı olarak e-postanızı, anahtar
                    olarak aşağıdaki metni kullanın; tür: zamana dayalı, 30 sn.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-[11px] break-all rounded bg-background px-2 py-1.5 font-mono border border-border flex-1 min-w-0">
                      {twoFactorSetup.secret}
                    </code>
                    <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => void handleCopyTwoFactorSecret()}>
                      <Copy className="h-3.5 w-3.5" />
                      Kopyala
                    </Button>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2" asChild>
                    <a href={twoFactorSetup.otpAuthUri}>Authenticator’da açmayı dene</a>
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    “Açmayı dene” bazı cihazlarda doğrudan uygulamayı açar; açılmazsa yukarıdaki anahtarı elle girin.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">6 haneli kod</Label>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="bg-background tracking-widest font-mono"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="gap-2"
                    disabled={twoFactorActivateLoading || totpCode.length !== 6}
                    onClick={handleConfirmTwoFactor}
                  >
                    <Check className="h-4 w-4" />
                    {twoFactorActivateLoading ? "Doğrulanıyor…" : "Etkinleştir"}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearTwoFactorQr}>
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-sm text-foreground">Oturum Uyarıları</p>
              <p className="text-xs text-muted-foreground">Yeni cihazdan giriş yapıldığında bildirim alın</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ComingSoonBadge />
              <Switch checked={false} disabled aria-readonly />
            </div>
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

        {myProfileError ? (
          <p className="text-sm text-destructive">Bildirim ayarları yüklenemedi.</p>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> E-posta Bildirimleri
          </h2>
          {[
            { label: "Önemli güncellemeler", desc: "Önemli güncellemeler için e-posta alın", state: emailNotifs, set: setEmailNotifs },
            { label: "Tarama uyarıları", desc: "QR kodlarınız tarandığında bildirim alın", state: scanAlerts, set: setScanAlerts },
            { label: "Haftalık rapor", desc: "Her pazartesi performans özeti alın", state: weeklyReport, set: setWeeklyReport },
            { label: "Pazarlama e-postaları", desc: "Yeni özellikler ve kampanyalar hakkında bilgi alın", state: marketingEmails, set: setMarketingEmails },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.state} onCheckedChange={item.set} disabled={myProfileLoading} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" /> Anlık Bildirimler
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-foreground">Push bildirimleri</p>
              <p className="text-xs text-muted-foreground">Tarayıcı üzerinden anlık bildirim tercihi (altyapı hazır olduğunda kullanılır)</p>
            </div>
            <Switch checked={pushBrowser} onCheckedChange={setPushBrowser} disabled={myProfileLoading} />
          </div>
        </div>

        <Button
          className="gap-2"
          onClick={handleSaveNotifications}
          disabled={notificationsSaving || myProfileLoading || myProfileError}
        >
          <Check className="h-4 w-4" /> {notificationsSaving ? "Kaydediliyor…" : "Kaydet"}
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
          <p className="text-xs text-muted-foreground">
            Açık veya koyu tema seçin; tercih tarayıcıda saklanır.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {(
              [
                { label: "Açık", icon: Sun, value: "light" as const },
                { label: "Koyu", icon: Moon, value: "dark" as const },
              ] as const
            ).map((t) => {
              const selected = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <t.icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" /> Dil
          </h2>
          <p className="text-xs text-muted-foreground">Arayüz dili (çoklu dil desteği yakında).</p>
          <Select
            value={language === "tr" || language === "en" ? language : "tr"}
            onValueChange={setLanguage}
          >
            <SelectTrigger className="bg-background max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="gap-2"
          onClick={() => onNotify("info", "Dil tercihi kaydedildi. Çeviri altyapısı hazır olduğunda uygulanacak.")}
        >
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

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center space-y-4">
        <Globe className="h-10 w-10 text-muted-foreground mx-auto opacity-60" />
        <div>
          <p className="text-sm font-medium text-foreground">API anahtarları ve webhooks</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Programatik erişim, anahtar yönetimi ve webhook yapılandırması üzerinde çalışıyoruz.
          </p>
        </div>
        <div className="flex justify-center">
          <ComingSoonBadge />
        </div>
      </div>
    </div>
  );
}
