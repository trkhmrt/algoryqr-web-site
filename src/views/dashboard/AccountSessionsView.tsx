"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useUserSessions } from "@/hooks/use-user-sessions";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatSessionDate,
  sessionStatusLabel,
  sessionTitle,
} from "@/lib/user-sessions-display";

const PAGE_SIZE = 10;

export default function AccountSessionsView() {
  const { notify } = useDashboardBanners();
  const [page, setPage] = useState(0);
  const {
    sessions,
    totalElements,
    totalPages,
    loading,
    error,
    revokingId,
    revoke,
  } = useUserSessions(true, { page, size: PAGE_SIZE });

  useEffect(() => {
    if (!loading && sessions.length === 0 && page > 0) {
      setPage((current) => Math.max(0, current - 1));
    }
  }, [loading, page, sessions.length]);

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={DASHBOARD_ROUTES.accountSecurity}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Oturumlar</h1>
          <p className="text-sm text-muted-foreground">
            Aktif ve geçmiş oturumlarınızı görüntüleyin, gerekirse sonlandırın.
          </p>
        </div>
      </div>

      <Card className="glow-card">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Tüm oturumlar
            {!loading && !error ? (
              <span className="text-muted-foreground font-normal">({totalElements})</span>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Oturumlar yükleniyor…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Oturum bulunamadı.</p>
          ) : (
            <div className="space-y-0">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{sessionTitle(session)}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        session.ipAddress,
                        `Giriş: ${formatSessionDate(session.loggedInAt)}`,
                        session.active
                          ? `Son: ${formatSessionDate(session.lastActivityAt)}`
                          : session.revokedAt
                            ? `İptal: ${formatSessionDate(session.revokedAt)}`
                            : `Bitiş: ${formatSessionDate(session.refreshExpiresAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {session.current ? (
                    <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Bu cihaz
                    </span>
                  ) : session.active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 text-xs text-destructive"
                      disabled={revokingId === session.sessionId}
                      onClick={() => {
                        void (async () => {
                          try {
                            const message = await revoke(session.sessionId);
                            notify("info", message);
                          } catch (err) {
                            notify(
                              "danger",
                              err instanceof ApiError ? err.message : "Oturum sonlandırılamadı.",
                            );
                          }
                        })();
                      }}
                    >
                      {revokingId === session.sessionId ? "Sonlandırılıyor…" : "Sonlandır"}
                    </Button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {sessionStatusLabel(session)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && totalElements > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1} / {safeTotalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Önceki
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Sonraki
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
