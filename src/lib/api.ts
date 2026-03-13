import axios, { AxiosError } from "axios";
import { GATEWAY_BASE } from "./config";

const USER_KEY = "algory_user";
const hasWindow = typeof window !== "undefined";


export interface StoredUser {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
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

export function clearStoredUser() {
  if (!hasWindow) return;
  localStorage.removeItem(USER_KEY);
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
  baseURL: GATEWAY_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status || 0;
    const errorData = error.response?.data as any;
    const message = errorData?.message || error.message || "Bir hata oluştu";

    if (status === 401 && hasWindow) {
      window.location.href = "/login";
    }

    return Promise.reject(new ApiError(status, message, errorData));
  }
);
