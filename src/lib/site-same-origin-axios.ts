"use client";

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { ApiError } from "@/lib/api/errors";

let refreshPromise: Promise<boolean> | null = null;

/** Aynı origin `POST /api/auth/refresh`; 401 ise logout + login. */
export async function refreshSiteSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const r = await axios.post("/api/auth/refresh", {}, {
          withCredentials: true,
          validateStatus: (s) => s < 500,
        });
        if (r.status === 401) {
          await axios.post("/api/auth/logout", {}, { withCredentials: true, validateStatus: () => true }).catch(() => undefined);
          window.location.assign("/login");
          return false;
        }
        if (r.status >= 200 && r.status < 300) return true;
        return false;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type SiteRetryCfg = InternalAxiosRequestConfig & { __site401Retried?: boolean };

let siteInstance: AxiosInstance | null = null;

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const msg =
    (error.response?.data as { message?: string })?.message ?? error.message ?? "Bir hata oluştu";
  return new ApiError(status, msg, error.response?.data);
}

/** `baseURL: /api` — httpOnly çerezler; 401 → refresh → tek retry; sonra `ApiError`. */
export function getSiteSameOriginAxios(): AxiosInstance {
  if (siteInstance) return siteInstance;
  siteInstance = axios.create({
    baseURL: "/api",
    timeout: 15_000,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    withCredentials: true,
  });
  siteInstance.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const cfg = error.config as SiteRetryCfg | undefined;
      if (typeof window !== "undefined" && status === 401 && cfg && !cfg.__site401Retried) {
        const url = `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
        if (
          !url.includes("/auth/refresh") &&
          !url.includes("/auth/login") &&
          !url.includes("/auth/logout")
        ) {
          cfg.__site401Retried = true;
          const ok = await refreshSiteSession();
          if (ok) {
            return siteInstance!.request(cfg);
          }
        }
      }
      return Promise.reject(toApiError(error));
    },
  );
  return siteInstance;
}
