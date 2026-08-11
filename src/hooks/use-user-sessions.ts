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

export interface UserSessionPage {
  content: UserSessionRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export type UseUserSessionsOptions = {
  page?: number;
  size?: number;
};

export function useUserSessions(enabled: boolean, options?: UseUserSessionsOptions) {
  const page = options?.page ?? 0;
  const size = options?.size ?? 10;
  const [sessions, setSessions] = useState<UserSessionRow[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getSiteSameOriginAxios().get<UserSessionPage>("/auth/sessions", {
        params: { page, size },
      });
      const data = response.data;
      const content = Array.isArray(data?.content) ? data.content : [];
      setSessions(content);
      setTotalElements(data?.totalElements ?? content.length);
      setTotalPages(data?.totalPages ?? 0);
      setHasNext(Boolean(data?.hasNext));
    } catch (err) {
      setSessions([]);
      setTotalElements(0);
      setTotalPages(0);
      setHasNext(false);
      setError(err instanceof ApiError ? err.message : "Oturumlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [enabled, page, size]);

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

  return {
    sessions,
    totalElements,
    totalPages,
    hasNext,
    loading,
    error,
    revokingId,
    reload,
    revoke,
  };
}
