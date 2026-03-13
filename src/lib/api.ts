import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE } from "./config";

// Token management
const TOKEN_KEY = "algory_access_token";
const REFRESH_TOKEN_KEY = "algory_refresh_token";
const USER_KEY = "algory_user";
const hasWindow = typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!hasWindow) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!hasWindow) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export interface StoredUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (!hasWindow) return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function setStoredUser(user: StoredUser) {
  if (!hasWindow) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (!hasWindow) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearTokens() {
  if (!hasWindow) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // httpOnly cookie temizliği SSR route üzerinden yapılır.
  fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Custom error class for backward compatibility
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor — otomatik token ekleme
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // auth: false olan isteklerde token ekleme (custom meta ile)
  if ((config as any)._skipAuth) return config;

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _skipAuth?: boolean };

    // 401 ve henüz retry yapılmamışsa
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuth) {
      if (isRefreshing) {
        // Zaten refresh yapılıyor, kuyruğa ekle
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken }, { withCredentials: true });
        const newAccessToken = data.accessToken || data.access_token;
        const newRefreshToken = data.refreshToken || data.refresh_token || refreshToken;
        setTokens(newAccessToken, newRefreshToken);
        if (data.user) setStoredUser(data.user);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ApiError'a dönüştür (geriye uyumluluk)
    const status = error.response?.status || 0;
    const errorData = error.response?.data as any;
    const message = errorData?.message || error.message || "Bir hata oluştu";
    return Promise.reject(new ApiError(status, message, errorData));
  }
);

// Helper: auth gerektirmeyen istekler için
export function noAuth() {
  return { _skipAuth: true } as any;
}
