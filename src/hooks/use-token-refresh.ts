"use client";

import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/errors";
import { REFRESH_AFTER_LOGIN_MS } from "@/lib/config";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

/** Access token süresi dolmadan kaç saniye önce refresh atılacak */
const REFRESH_BUFFER_SECONDS = 30;

/**
 * Girişten sonra en geç 5 dk içinde refresh isteği atar; token daha erken bitiyorsa exp'ten 30 sn önce atar.
 * Verilmezse accessTokenExpiresAt /api/auth/token-exp ile alınır.
 */
export function useTokenRefresh(accessTokenExpiresAt?: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [expFromApi, setExpFromApi] = useState<number | null>(null);
  const exp = accessTokenExpiresAt ?? expFromApi ?? undefined;

  useEffect(() => {
    if (accessTokenExpiresAt != null) return;
    let cancelled = false;
    getSiteSameOriginAxios()
      .get<{ accessTokenExpiresAt: number | null }>("/auth/token-exp")
      .then((res) => {
        if (!cancelled && res.data?.accessTokenExpiresAt != null)
          setExpFromApi(res.data.accessTokenExpiresAt);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessTokenExpiresAt]);

  useEffect(() => {
    if (exp == null || exp <= 0) return;

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExp = exp - now;
    if (secondsUntilExp <= 0) return;

    const fromExpMs = Math.max(1000, (secondsUntilExp - REFRESH_BUFFER_SECONDS) * 1000);
    const refreshInMs = Math.min(REFRESH_AFTER_LOGIN_MS, fromExpMs);

    timeoutRef.current = setTimeout(() => {
      getSiteSameOriginAxios()
        .post<{ accessTokenExpiresAt?: number }>("/auth/refresh", {})
        .then((res) => {
          const nextExp = res.data?.accessTokenExpiresAt;
          if (nextExp != null) setExpFromApi(nextExp);
        })
        .catch((err: unknown) => {
          const status = err instanceof ApiError ? err.status : 0;
          if (status === 401 && typeof window !== "undefined") {
            window.location.href = "/login";
          }
        });
    }, refreshInMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [exp]);
}
