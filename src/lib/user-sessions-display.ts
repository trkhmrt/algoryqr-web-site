import type { UserSessionRow } from "@/hooks/use-user-sessions";

export function formatSessionDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function sessionTitle(session: UserSessionRow): string {
  const device = session.device?.trim();
  if (device) return device;
  const type = session.deviceType?.trim();
  if (type) return type;
  return "Bilinmeyen cihaz";
}

export function sessionStatusLabel(session: UserSessionRow): string {
  if (session.current) return "Bu cihaz";
  if (session.active) return "Aktif";
  if (session.revoked) return "İptal edildi";
  if (session.expired) return "Süresi doldu";
  return "Pasif";
}

export function sortSessions(sessions: UserSessionRow[]): UserSessionRow[] {
  return [...sessions].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    if (a.active !== b.active) return a.active ? -1 : 1;
    const aTime = new Date(a.lastActivityAt ?? a.loggedInAt ?? 0).getTime();
    const bTime = new Date(b.lastActivityAt ?? b.loggedInAt ?? 0).getTime();
    return bTime - aTime;
  });
}
