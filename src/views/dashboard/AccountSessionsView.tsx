"use client";

import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useUserSessions, type UserSessionRow } from "@/hooks/use-user-sessions";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  formatSessionDate,
  sessionStatusLabel,
  sessionTitle,
} from "@/lib/user-sessions-display";

const PAGE_SIZE = 50;
const PREVIEW_LIMIT = 5;

function sessionMeta(session: UserSessionRow): string {
  if (session.current) {
    return `Giriş: ${formatSessionDate(session.loggedInAt)}`;
  }
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

function SessionRow({
  session,
  revokingId,
  onRevoke,
}: {
  session: UserSessionRow;
  revokingId: string | null;
  onRevoke: (sessionId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground truncate">{sessionTitle(session)}</p>
        <p className="text-xs text-muted-foreground truncate">{sessionMeta(session)}</p>
      </div>
      {session.active && !session.current ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs text-destructive"
          disabled={revokingId === session.sessionId}
          onClick={() => onRevoke(session.sessionId)}
        >
          {revokingId === session.sessionId ? "Sonlandırılıyor…" : "Sonlandır"}
        </Button>
      ) : (
        <span
          className={
            session.current
              ? "shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"
              : "shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning"
          }
        >
          {session.current ? "Aktif oturum" : sessionStatusLabel(session)}
        </span>
      )}
    </div>
  );
}

export default function AccountSessionsView() {
  const { notify } = useDashboardBanners();
  const { sessions, loading, error, revokingId, revoke } = useUserSessions(true, {
    page: 0,
    size: PAGE_SIZE,
  });

  const currentSession = sessions.find((session) => session.current) ?? null;
  const otherActiveSessions = sessions.filter((session) => !session.current && session.active);
  const oldSessions = sessions.filter((session) => !session.current && !session.active);
  const otherActivePreview = otherActiveSessions.slice(0, PREVIEW_LIMIT);
  const oldPreview = oldSessions.slice(0, PREVIEW_LIMIT);

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
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={DASHBOARD_ROUTES.accountSecurity}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Oturumlar</h1>
          <p className="text-sm text-muted-foreground">
            Açık cihazlar ve geçmiş oturumların özeti.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Oturumlar yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-success/40 bg-success/5 p-5 flex flex-col gap-3 min-h-[180px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4 text-success" /> Bu Cihaz
              </h2>
              {currentSession ? (
                <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  Aktif oturum
                </span>
              ) : null}
            </div>
            {currentSession ? (
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{sessionTitle(currentSession)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Giriş: {formatSessionDate(currentSession.loggedInAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex-1">Aktif oturum bulunamadı.</p>
            )}
          </div>

          <div className="rounded-lg border border-[hsl(var(--chart-violet)/0.35)] bg-gradient-to-b from-[hsl(var(--chart-violet)/0.14)] via-[hsl(var(--chart-violet)/0.06)] to-transparent p-5 flex flex-col gap-3 min-h-[180px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[hsl(var(--chart-violet))]" /> Diğer aktif oturumlar
              </h2>
              {otherActiveSessions.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {Math.min(otherActiveSessions.length, PREVIEW_LIMIT)}
                  {otherActiveSessions.length > PREVIEW_LIMIT
                    ? ` / ${otherActiveSessions.length}`
                    : ""}
                </span>
              ) : null}
            </div>
            {otherActivePreview.length === 0 ? (
              <p className="text-sm text-muted-foreground flex-1">Başka aktif oturum yok.</p>
            ) : (
              <div className="flex-1">
                {otherActivePreview.map((session) => (
                  <SessionRow
                    key={session.sessionId}
                    session={session}
                    revokingId={revokingId}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            )}
            {otherActiveSessions.length > PREVIEW_LIMIT ? (
              <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
                <Link href={DASHBOARD_ROUTES.accountSessionsDetail}>Tümünü gör</Link>
              </Button>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" /> Eski oturumlar
              </h2>
              {oldSessions.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {Math.min(oldSessions.length, PREVIEW_LIMIT)}
                  {oldSessions.length > PREVIEW_LIMIT ? ` / ${oldSessions.length}` : ""}
                </span>
              ) : null}
            </div>
            {oldPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">Eski oturum yok.</p>
            ) : (
              <div>
                {oldPreview.map((session) => (
                  <SessionRow
                    key={session.sessionId}
                    session={session}
                    revokingId={revokingId}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            )}
            {oldSessions.length > PREVIEW_LIMIT ? (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={DASHBOARD_ROUTES.accountSessionsDetail}>Tümünü gör</Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
