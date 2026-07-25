"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { invalidateMyProfile, useMyProfile, MY_PROFILE_QUERY_KEY } from "@/hooks/use-my-profile";
import { useAccessProfile } from "@/hooks/use-access-profile";
import type { MyProfile } from "@/hooks/use-my-profile";
import {
  User, Shield, Bell, ChevronRight, ArrowLeft,
  Check, Camera, Key, Lock, Smartphone, Mail,
  RefreshCw, LogOut, Timer, Copy, CreditCard,
  WalletCards, MapPin, History, Monitor,
} from "lucide-react";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { authService, type TwoFactorSetupPayload } from "@/lib/auth-service";
import { copyTextToClipboard } from "@/components/dashboard/qr/qr-actions";
import { ChangePasswordDialog } from "@/components/dashboard/ChangePasswordDialog";
import { ChangeEmailDialog } from "@/components/dashboard/ChangeEmailDialog";
import { ApiError } from "@/lib/api";
import { getStoredUser, setStoredUser } from "@/lib/api/storage";
import { useUserSessions, type UserSessionRow } from "@/hooks/use-user-sessions";

const NEXT_REFRESH_AT_KEY = "algory_next_refresh_at";
const REFRESH_BUFFER_SECONDS = 30;

function nextRefreshAtFromAccessExp(accessExpSeconds: number): number {
  return Math.max(Date.now() + 1000, accessExpSeconds * 1000 - REFRESH_BUFFER_SECONDS * 1000);
}

type SettingsPage = "main" | "profile" | "security" | "notifications" | "session";

type SettingsMenuKey = SettingsPage | "subscription" | "paymentMethods" | "billingAddresses";

interface SettingsTabProps {
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
}

function formatSessionDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function sessionTitle(session: UserSessionRow): string {
  const device = session.device?.trim();
  if (device) return device;
  const type = session.deviceType?.trim();
  if (type) return type;
  return "Bilinmeyen cihaz";
}

function sessionStatusLabel(session: UserSessionRow): string {
  if (session.revoked) return "İptal edildi";
  if (session.expired) return "Süresi doldu";
  return "Pasif";
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
  const { data: accessProfile } = useAccessProfile();
  const isGoogleAccount = accessProfile?.provider === "GOOGLE";
  const [page, setPage] = useState<SettingsPage>("main");

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
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const twoFactorEnabled = myProfile?.twoFactorEnabled ?? false;
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupPayload | null>(null);
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false);
  const [twoFactorActivateLoading, setTwoFactorActivateLoading] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [twoFactorDisableLoading, setTwoFactorDisableLoading] = useState(false);

  const [emailNotifs, setEmailNotifs] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    revokingId,
    revoke: revokeSession,
  } = useUserSessions(page === "security");

  const activeSessions = sessions.filter((session) => session.active);
  const pastSessions = sessions.filter((session) => !session.active);

  useEffect(() => {
    if (page !== "security") setShowPastSessions(false);
  }, [page]);

  const fetchTokenExp = useCallback(() => {
    setTokenLoading(true);
    getSiteSameOriginAxios()
      .get<{ accessTokenExpiresAt: number | null; refreshTokenExpiresAt: number | null }>("/auth/token-exp")
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
          const computedAt = nextRefreshAtFromAccessExp(accessExp);
          const useStored = !isNaN(storedAt) && storedAt > Date.now() && storedAt <= computedAt;
          const at = useStored ? storedAt : computedAt;
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
    setWeeklyReport(myProfile.notifyWeeklyReport);
    setMarketingEmails(myProfile.notifyMarketingEmails);
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
        getSiteSameOriginAxios()
          .post<{ accessTokenExpiresAt?: number }>("/auth/refresh", {})
          .then((res) => {
            const exp = res.data?.accessTokenExpiresAt;
            if (exp != null) setAccessTokenExpiresAt(exp);
            onNotify("info", "Token otomatik yenilendi.");
            fetchTokenExp();
            const nextAt =
              exp != null ? nextRefreshAtFromAccessExp(exp) : null;
            setNextRefreshAt(nextAt);
            if (nextAt != null && typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(NEXT_REFRESH_AT_KEY, String(nextAt));
            }
          })
          .catch((err: unknown) => {
            const status = err instanceof ApiError ? err.status : 0;
            if (status === 401) {
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

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("algory_user");
      }
      await getSiteSameOriginAxios().post("/auth/logout", {}).catch(() => undefined);
      router.push("/login");
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleRevoke = () => {
    setRevokeLoading(true);
    getSiteSameOriginAxios()
      .post("/auth/revoke", {})
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
    getSiteSameOriginAxios()
      .post<{ accessTokenExpiresAt?: number }>("/auth/refresh", {})
      .then((res) => {
        const exp = res.data?.accessTokenExpiresAt;
        if (exp != null) {
          setAccessTokenExpiresAt(exp);
          const nextAt = nextRefreshAtFromAccessExp(exp);
          setNextRefreshAt(nextAt);
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(NEXT_REFRESH_AT_KEY, String(nextAt));
          }
        }
        onNotify("info", "Access token yenilendi.");
        fetchTokenExp();
      })
      .catch((err: unknown) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 401) {
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
      await getSiteSameOriginAxios().patch("/account/myprofile", {
        firstName,
        lastName,
        phoneNumber: phone,
      });
      await invalidateMyProfile(queryClient);
      onNotify("info", "Profil bilgileriniz güncellendi.");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      onNotify("danger", msg ?? "Profil kaydedilemedi.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);
    try {
      await getSiteSameOriginAxios().patch("/account/myprofile", {
        notifyEmailImportant: emailNotifs,
        notifyScanAlerts: myProfile?.notifyScanAlerts ?? false,
        notifyWeeklyReport: weeklyReport,
        notifyMarketingEmails: marketingEmails,
        notifyPushBrowser: myProfile?.notifyPushBrowser ?? false,
      });
      await invalidateMyProfile(queryClient);
      onNotify("info", "Bildirim tercihleri kaydedildi.");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      onNotify("danger", msg ?? "Tercihler kaydedilemedi.");
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handlePasswordChangeSuccess = async () => {
    await getSiteSameOriginAxios().post("/auth/logout", {}).catch(() => undefined);
    router.replace("/login");
  };

  const handleEmailChangeSuccess = async () => {
    try {
      await getSiteSameOriginAxios().post("/auth/refresh", {});
      const profile = await queryClient.fetchQuery({
        queryKey: MY_PROFILE_QUERY_KEY,
        queryFn: async () => {
          const { data } = await getSiteSameOriginAxios().get<MyProfile>("/account/myprofile");
          return data;
        },
      });
      if (profile?.email) {
        setEmail(profile.email);
        const stored = getStoredUser();
        if (stored) {
          setStoredUser({ ...stored, email: profile.email });
        }
      }
      await fetchTokenExp();
      onNotify("info", "E-posta adresiniz güncellendi. Oturumunuz yeni e-posta ile yenilendi.");
    } catch {
      onNotify("warning", "E-posta güncellendi fakat oturum yenilenemedi. Lütfen tekrar giriş yapın.");
      await getSiteSameOriginAxios().post("/auth/logout", {}).catch(() => undefined);
      router.replace("/login");
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hesabım</h1>
          <p className="text-sm text-muted-foreground">Abonelik, profil ve uygulama ayarlarınızı yönetin</p>
        </div>
        <div className="grid gap-4">
          {([
            { icon: CreditCard, title: "Abonelik", desc: "Aktif paketinizi görün ve yeni paket satın alın", key: "subscription" },
            { icon: WalletCards, title: "Kayıtlı Kartlarım", desc: "Ödemelerde kullanacağınız kartları yönetin", key: "paymentMethods" },
            { icon: MapPin, title: "Fatura Adreslerim", desc: "Fatura bilgilerinizi görüntüleyin ve düzenleyin", key: "billingAddresses" },
            { icon: Key, title: "Oturum / Token", desc: "Access token kalan süre, yenileme ve revoke", key: "session" },
            { icon: User, title: "Profil Bilgileri", desc: "Ad, soyad, e-posta ve telefon bilgilerinizi güncelleyin", key: "profile" },
            { icon: Shield, title: "Güvenlik", desc: "Şifre, 2FA ve oturumlar", key: "security" },
            { icon: Bell, title: "Bildirimler", desc: "E-posta bildirim tercihlerinizi yönetin", key: "notifications" },
          ] as const satisfies ReadonlyArray<{ icon: typeof CreditCard; title: string; desc: string; key: SettingsMenuKey }>).map((item) => (
            <Card
              key={item.title}
              className="glow-card cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                if (item.key === "subscription") {
                  router.push(DASHBOARD_ROUTES.accountSubscription);
                  return;
                }
                if (item.key === "paymentMethods") {
                  router.push(DASHBOARD_ROUTES.accountPaymentMethods);
                  return;
                }
                if (item.key === "billingAddresses") {
                  router.push(DASHBOARD_ROUTES.accountBillingAddresses);
                  return;
                }
                setPage(item.key as SettingsPage);
              }}
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

        <Card className="glow-card border-destructive/20">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Çıkış Yap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hesabınızdan güvenli şekilde çıkış yapın</p>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => void handleLogout()}
              disabled={logoutLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutLoading ? "Çıkış yapılıyor…" : "Çıkış Yap"}
            </Button>
          </CardContent>
        </Card>
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
                Yenileme isteği (access bitmeden ~30 sn önce)
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={email || myProfile?.email || ""}
                className="bg-muted"
                disabled
                readOnly
              />
              <Button
                type="button"
                variant="secondary"
                className="gap-2 shrink-0"
                onClick={() => setEmailDialogOpen(true)}
                disabled={myProfileLoading || myProfileError || isGoogleAccount}
              >
                <Mail className="h-4 w-4" /> E-posta Değiştir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isGoogleAccount
                ? "Google hesabıyla giriş yaptığınız için e-posta adresiniz değiştirilemez."
                : "E-posta değişikliği için önce mevcut, ardından yeni adresinize 5 dakika geçerli doğrulama kodu gönderilir."}
            </p>
          </div>
          <ChangeEmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            currentEmail={email || myProfile?.email || ""}
            onNotify={onNotify}
            onSuccess={() => void handleEmailChangeSuccess()}
          />
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

        {!isGoogleAccount && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" /> Şifre Değiştir
            </h2>
            <p className="text-sm text-muted-foreground">
              Şifrenizi değiştirmek için e-posta adresinize 6 haneli bir doğrulama kodu gönderilir.
              Kod 5 dakika geçerlidir. Kod doğrulandıktan sonra yeni şifrenizi belirleyebilirsiniz.
            </p>
            <Button className="gap-2" onClick={() => setPasswordDialogOpen(true)}>
              <Key className="h-4 w-4" /> Şifre Değiştir
            </Button>
            <ChangePasswordDialog
              open={passwordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
              onNotify={onNotify}
              onSuccess={() => void handlePasswordChangeSuccess()}
            />
          </div>
        )}

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
                <Image
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

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" /> Aktif Oturumlar
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowPastSessions((value) => !value)}
            >
              <History className="h-3.5 w-3.5" />
              {showPastSessions ? "Geçmişi gizle" : "Geçmiş oturumları göster"}
            </Button>
          </div>

          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Oturumlar yükleniyor…</p>
          ) : sessionsError ? (
            <p className="text-sm text-destructive">{sessionsError}</p>
          ) : activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aktif oturum bulunamadı.</p>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{sessionTitle(session)}</p>
                  <p className="text-xs text-muted-foreground">
                    {[session.ipAddress, `Giriş: ${formatSessionDate(session.loggedInAt)}`, `Son: ${formatSessionDate(session.lastActivityAt)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {session.current ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium shrink-0">
                    Bu cihaz
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive h-7 shrink-0"
                    disabled={revokingId === session.sessionId}
                    onClick={() => {
                      void (async () => {
                        try {
                          const message = await revokeSession(session.sessionId);
                          onNotify("info", message);
                        } catch (error) {
                          onNotify(
                            "danger",
                            error instanceof ApiError ? error.message : "Oturum sonlandırılamadı.",
                          );
                        }
                      })();
                    }}
                  >
                    {revokingId === session.sessionId ? "Sonlandırılıyor…" : "Sonlandır"}
                  </Button>
                )}
              </div>
            ))
          )}

          {showPastSessions && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground">Geçmiş oturumlar</h3>
              {pastSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geçmiş oturum bulunamadı.</p>
              ) : (
                pastSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{sessionTitle(session)}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          session.ipAddress,
                          `Giriş: ${formatSessionDate(session.loggedInAt)}`,
                          session.revokedAt
                            ? `İptal: ${formatSessionDate(session.revokedAt)}`
                            : `Bitiş: ${formatSessionDate(session.refreshExpiresAt)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
                      {sessionStatusLabel(session)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
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

  return null;
}
