"use client";

import Link from "next/link";
import {
  QrCode,
  Plus,
  ArrowRight,
  Monitor,
  Shield,
  ShieldCheck,
  ShieldOff,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PackageUsageCard from "@/components/dashboard/PackageUsageCard";
import { useDigitalMenuOptions } from "@/components/dashboard/menu/DigitalMenuPicker";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatPackageDate, formatPackagePrice } from "@/lib/package-display";
import { useMyProfile } from "@/hooks/use-my-profile";
import { usePackageUsage } from "@/hooks/use-package-usage";
import { useSubscription } from "@/hooks/use-subscription";
import { useUserQrs } from "@/hooks/use-user-qrs";
import { useUserSessions, type UserSessionRow } from "@/hooks/use-user-sessions";

function sessionTitle(session: UserSessionRow): string {
  const device = session.device?.trim();
  if (device) return device;
  const type = session.deviceType?.trim();
  if (type) return type;
  return "Bilinmeyen cihaz";
}

function sessionStatusLabel(session: UserSessionRow): string {
  if (session.current) return "Bu cihaz";
  if (session.active) return "Aktif";
  if (session.revoked) return "İptal edildi";
  if (session.expired) return "Süresi doldu";
  return "Pasif";
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

function sortSessions(sessions: UserSessionRow[]): UserSessionRow[] {
  return [...sessions].sort((a, b) => {
    const aTime = Date.parse(a.lastActivityAt ?? a.loggedInAt ?? "") || 0;
    const bTime = Date.parse(b.lastActivityAt ?? b.loggedInAt ?? "") || 0;
    return bTime - aTime;
  });
}

export default function DashboardOverviewView() {
  const packageUsage = usePackageUsage();
  const subscription = useSubscription();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: qrs, isLoading: qrsLoading } = useUserQrs("me");
  const { menuQrs, loading: menusLoading } = useDigitalMenuOptions();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useUserSessions(true);

  const recentPurchases = (subscription.data?.purchases ?? []).slice(0, 5);
  const qrList = qrs ?? [];
  const recentQrs = [...qrList].sort((a, b) => b.id - a.id).slice(0, 5);
  const recentSessions = sortSessions(sessions).slice(0, 5);
  const activeSessionCount = sessions.filter((session) => session.active).length;
  const twoFactorEnabled = profile?.twoFactorEnabled ?? false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Genel Bakış</h1>
          <p className="text-sm text-muted-foreground">Hesabınızın özeti.</p>
        </div>
        <Button variant="hero" size="sm" className="gap-2" asChild>
          <Link href={DASHBOARD_ROUTES.qrCodesNew}>
            <Plus className="h-4 w-4" />
            Yeni QR Kod
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <PackageUsageCard usage={packageUsage.data} isLoading={packageUsage.isLoading} />
        <Card className="glow-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Paket geçmişi</p>
                <p className="text-xs text-muted-foreground">Son satın almalarınız</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link href={DASHBOARD_ROUTES.accountPaymentHistory}>
                  Tümünü gör
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {subscription.isLoading ? (
              <div className="h-20 animate-pulse rounded-md bg-muted" />
            ) : recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz satın alma kaydı yok.</p>
            ) : (
              <div className="space-y-2">
                {recentPurchases.map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={DASHBOARD_ROUTES.accountPurchaseDetail(purchase.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{purchase.packageName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPackageDate(purchase.purchasedAt)}
                        {purchase.paymentId ? ` · ${purchase.paymentId}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-foreground">
                      {formatPackagePrice(purchase.price ?? 0, purchase.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">QR Kodlar</p>
                {qrsLoading ? (
                  <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{qrList.length}</p>
                )}
              </div>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </div>
            <Link
              href={DASHBOARD_ROUTES.qrCodes}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              QR Kodlarım
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aktif Menüler</p>
                {menusLoading ? (
                  <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{menuQrs.length}</p>
                )}
              </div>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </div>
            <Link
              href={DASHBOARD_ROUTES.digitalMenu}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Dijital Menü
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aktif Oturumlar</p>
                {sessionsLoading ? (
                  <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{activeSessionCount}</p>
                )}
              </div>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </div>
            <Link
              href={DASHBOARD_ROUTES.accountSecurity}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Görüntüle
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">İki Faktörlü Doğrulama</p>
                {profileLoading ? (
                  <div className="mt-2 h-8 w-20 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {twoFactorEnabled ? "Açık" : "Kapalı"}
                  </p>
                )}
              </div>
              {profileLoading ? (
                <Shield className="h-4 w-4 text-muted-foreground" />
              ) : twoFactorEnabled ? (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <ShieldOff className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <Link
              href={DASHBOARD_ROUTES.accountSecurity}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {twoFactorEnabled ? "Güvenlik ayarları" : "2FA’yı etkinleştir"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glow-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Son oturumlar</p>
                <p className="text-xs text-muted-foreground">Giriş yaptığınız cihazlar</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link href={DASHBOARD_ROUTES.accountSecurity}>
                  Tümünü gör
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {sessionsLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            ) : sessionsError ? (
              <p className="text-sm text-destructive">{sessionsError}</p>
            ) : recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz oturum kaydı yok.</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{sessionTitle(session)}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          session.ipAddress,
                          `Giriş: ${formatSessionDate(session.loggedInAt)}`,
                          `Son: ${formatSessionDate(session.lastActivityAt)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span
                      className={
                        session.current || session.active
                          ? "shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                          : "shrink-0 text-[10px] font-medium text-muted-foreground"
                      }
                    >
                      {sessionStatusLabel(session)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Son QR kodlar</p>
                <p className="text-xs text-muted-foreground">En son oluşturduklarınız</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                <Link href={DASHBOARD_ROUTES.qrCodes}>
                  Tümünü gör
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {qrsLoading ? (
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            ) : recentQrs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz QR kodunuz yok.</p>
            ) : (
              <div className="space-y-2">
                {recentQrs.map((qr) => (
                  <Link
                    key={qr.id}
                    href={DASHBOARD_ROUTES.qrCodeDetail(qr.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{qr.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {qr.created}
                        {qr.type ? ` · ${qr.type}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {qr.active ? "Aktif" : "Pasif"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
