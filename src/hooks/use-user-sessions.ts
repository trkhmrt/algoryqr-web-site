"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export interface UserSessionRow {
  sessionId: string;
  loggedInAt: string | null;
  lastActivityAt: string | null;
  accessExpiresAt: string | null;
  refreshExpiresAt: string | null;
  revoked: boolean;
  revokedAt: string | null;
  expired: boolean;
  active: boolean;
  current: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  deviceType: string | null;
}

export function useUserSessions(enabled: boolean) {
  const [sessions, setSessions] = useState<UserSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getSiteSameOriginAxios().get<UserSessionRow[]>("/auth/sessions");
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setSessions([]);
      setError(err instanceof ApiError ? err.message : "Oturumlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const revoke = useCallback(async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const response = await getSiteSameOriginAxios().delete<{ message?: string }>(
        `/auth/sessions/${encodeURIComponent(sessionId)}`,
      );
      await reload();
      return response.data?.message ?? "Oturum iptal edildi";
    } finally {
      setRevokingId(null);
    }
  }, [reload]);

  return { sessions, loading, error, revokingId, reload, revoke };
}
