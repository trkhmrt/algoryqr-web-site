import axios, { AxiosError } from "axios";
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
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  if (!hasWindow) return;
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

export type QrRequestDetails =
  | {
      url: string;
    }
  | {
      ssid: string;
      password: string;
      security: "WPA" | "WEP" | "NONE";
    }
  | {
      mail: string;
      subject: string;
      body: string;
    }
  | {
      fullName: string;
      phone: string;
      mail: string;
      company: string;
      title: string;
    }
  | {
      text: string;
    }
  | {
      latitude: string;
      longitude: string;
      label: string;
    };

export interface CreateQrRequestBody {
  qrName: string;
  type: string;
  details: QrRequestDetails;
}

export interface QrResponse {
  id: string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
  imgSrc: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
  scans: number;
}

export interface CreateQrResponse {
  qrResponse: QrResponse;
}

export interface UserQrApiItem {
  qrId: number;
  userId: number;
  qrName: string;
  imgSrc: string;
  details: Record<string, unknown>;
  createdAt: string;
}

type CreateQrGatewayResponse = {
  imgSrc: string;
};

export async function createQrRequest(payload: CreateQrRequestBody): Promise<CreateQrResponse> {
  const requestBody = {
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.post<CreateQrGatewayResponse>("/qr/create", requestBody);
  const now = new Date().toISOString();

  return {
    qrResponse: {
      id: `temp-${Date.now()}`,
      qrName: payload.qrName,
      type: payload.type,
      details: payload.details,
      imgSrc: response.data.imgSrc,
      status: "active",
      createdAt: now,
      updatedAt: now,
      scans: 0,
    },
  };
}

export async function getUserQrsRequest(userId: number | string): Promise<UserQrApiItem[]> {
  const response = await api.get<UserQrApiItem[]>(`/qr/user/${userId}`);
  return response.data;
}

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const msg = (err.response?.data as { message?: string })?.message ?? err.message ?? "Bir hata oluştu";
    if (status === 401 && hasWindow) window.location.href = "/login";
    return Promise.reject(new ApiError(status, msg, err.response?.data));
  }
);
