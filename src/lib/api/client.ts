import axios, { AxiosError } from "axios";
import { ApiError } from "./errors";

const hasWindow = typeof window !== "undefined";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const msg = (err.response?.data as { message?: string })?.message ?? err.message ?? "Bir hata oluştu";
    if (status === 401 && hasWindow) window.location.href = "/login";
    return Promise.reject(new ApiError(status, msg, err.response?.data));
  }
);
