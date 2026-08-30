"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Monitor, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useUserSessions, type UserSessionRow } from "@/hooks/use-user-sessions";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  formatSessionDate,
  matchesSessionSearch,
  sessionStatusLabel,
  sessionTitle,
  sortSessions,
} from "@/lib/user-sessions-display";

const PAGE_SIZE = 50;

function sessionMeta(session: UserSessionRow): string {
  return [
    session.ipAddress,
    `Giriş: ${formatSessionDate(session.loggedInAt)}`,
    session.active
      ? `Son: ${formatSessionDate(session.lastActivityAt)}`
      : session.revokedAt
        ? `İptal: ${formatSessionDate(session.revokedAt)}`
        : `Bitiş: ${formatSessionDate(session.refreshExpiresAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function AccountSessionsDetailView() {
  const { notify } = useDashboardBanners();
  const [query, setQuery] = useState("");
  const { sessions, loading, error, revokingId, revoke } = useUserSessions(true, {
    page: 0,
    size: PAGE_SIZE,
  });

  const filtered = useMemo(
    () => sortSessions(sessions.filter((session) => matchesSessionSearch(session, query))),
    [sessions, query],
  );

  const handleRevoke = (sessionId: string) => {
    void (async () => {
      try {
        const message = await revoke(sessionId);
        notify("info", message);
      } catch (err) {
        notify("danger", err instanceof ApiError ? err.message : "Oturum sonlandırılamadı.");
      }
    })();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Oturum Detayı"
        hint="Tüm oturumları IP, cihaz veya tarayıcıya göre arayın."
        back={
          <Link href={DASHBOARD_ROUTES.accountSessions} aria-label="Oturumlara dön" className={DASHBOARD_BACK}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <DashboardFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="IP, cihaz, tarayıcı veya durum ara…"
          className="pl-9 bg-background"
          aria-label="Oturum ara"
        />
        </div>
      </DashboardFilterBar>

      <div className={`${DASHBOARD_SURFACE} p-5 space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" /> Tüm oturumlar
          </h2>
          {!loading && !error ? (
            <span className="text-xs text-muted-foreground">
              {filtered.length}
              {query.trim() ? ` / ${sessions.length}` : ""}
            </span>
          ) : null}
        </div>

        {loading ? (
          <DashboardLoadingState label="Oturumlar yükleniyor…" className="border-0 bg-transparent p-0" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {query.trim() ? "Aramayla eşleşen oturum yok." : "Oturum bulunamadı."}
          </p>
        ) : (
          <div>
            {filtered.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{sessionTitle(session)}</p>
                  <p className="text-xs text-muted-foreground truncate">{sessionMeta(session)}</p>
                </div>
                {session.current ? (
                  <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Bu cihaz
                  </span>
                ) : session.active ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-xs text-destructive"
                    disabled={revokingId === session.sessionId}
                    onClick={() => handleRevoke(session.sessionId)}
                  >
                    {revokingId === session.sessionId ? "Sonlandırılıyor…" : "Sonlandır"}
                  </Button>
                ) : (
                  <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    {sessionStatusLabel(session)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
