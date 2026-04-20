import { AxiosError } from "axios";

import { ApiError, setStoredUser } from "./api";
import {
  getJsonErrorText,
  isLikelyWrongTotpBackendText,
  TOTP_WRONG_USER_MESSAGE,
} from "./api-error-text";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

function client() {
  return getSiteSameOriginAxios();
}

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  accessTokenExpiresAt?: number;
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  requiresTwoFactor?: boolean;
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface GoogleUserResponse {
  userId: number;
  firstName?: string;
  familyName?: string;
  email: string;
  phoneNumber?: string;
}

function mapGoogleUserToStoredUser(user: GoogleUserResponse) {
  return {
    id: String(user.userId),
    email: user.email,
    first_name: user.firstName,
    last_name: user.familyName,
  };
}

function toApiError(e: unknown, fallback: string): ApiError {
  if (e instanceof ApiError) return e;
  const err = e as AxiosError<unknown>;
  const status = err.response?.status ?? 0;
  const from = getJsonErrorText(err.response?.data);
  const message = from || err.message || fallback;
  return new ApiError(status, message, err.response?.data);
}

function toTotpSubmitApiError(e: unknown, fallback: string): ApiError {
  if (e instanceof ApiError) {
    const from = e.message;
    if (isLikelyWrongTotpBackendText(from)) {
      return new ApiError(e.status, TOTP_WRONG_USER_MESSAGE, e.data);
    }
    if (e.status === 401) {
      if (/oturum|token|giriş|yetkisiz/i.test(from)) {
        return e;
      }
      return new ApiError(e.status, TOTP_WRONG_USER_MESSAGE, e.data);
    }
    return e;
  }
  const err = e as AxiosError<unknown>;
  const status = err.response?.status ?? 0;
  const from = getJsonErrorText(err.response?.data);
  if (isLikelyWrongTotpBackendText(from)) {
    return new ApiError(status, TOTP_WRONG_USER_MESSAGE, err.response?.data);
  }
  if (status === 401) {
    if (/oturum|token|giriş|yetkisiz/i.test(from)) {
      return new ApiError(status, from || fallback, err.response?.data);
    }
    return new ApiError(status, TOTP_WRONG_USER_MESSAGE, err.response?.data);
  }
  return toApiError(e, fallback);
}

export interface TwoFactorSetupPayload {
  secret: string;
  issuer: string;
  accountLabel: string;
  qrImageBase64: string;
  otpAuthUri: string;
}

export const authService = {
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await client().post<AuthResponse>("/auth/login", params);
      if (data.requiresTwoFactor) {
        return data;
      }
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null) {
        setStoredUser({
          id: String(data.userId),
          email: data.email ?? params.email,
          first_name: data.firstName,
          last_name: data.lastName,
        });
      } else if (params.email) setStoredUser({ id: params.email, email: params.email });
      return data;
    } catch (e) {
      throw toApiError(e, "Giriş başarısız");
    }
  },

  async completeTwoFactorLogin(code: string): Promise<AuthResponse> {
    try {
      const { data } = await client().post<AuthResponse>("/auth/2fa/login/verify", { code });
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null) {
        setStoredUser({
          id: String(data.userId),
          email: data.email ?? "",
          first_name: data.firstName,
          last_name: data.lastName,
        });
      }
      return data;
    } catch (e) {
      throw toTotpSubmitApiError(e, "2FA doğrulaması başarısız");
    }
  },

  async register(params: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    registrationRole?: string;
  }): Promise<AuthResponse> {
    try {
      const { data } = await client().post<AuthResponse>("/auth/register", {
        ...params,
        registrationRole: params.registrationRole ?? "QR_USER",
      });
      if (data.user) setStoredUser(data.user);
      return data;
    } catch (e) {
      throw toApiError(e, "Kayıt başarısız");
    }
  },

  async googleLogin(idToken: string): Promise<GoogleUserResponse & AuthResponse> {
    try {
      const { data } = await client().post<GoogleUserResponse & AuthResponse>("/auth/google/login", idToken, {
        headers: { "Content-Type": "text/plain" },
        transformRequest: [(d) => d],
      });
      if (data.requiresTwoFactor) {
        return data;
      }
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null || data.email) setStoredUser(mapGoogleUserToStoredUser(data as GoogleUserResponse));
      return data;
    } catch (e) {
      throw toApiError(e, "Google ile giriş başarısız");
    }
  },

  async googleRegister(
    idToken: string,
    registrationRole: string = "QR_USER",
  ): Promise<GoogleUserResponse & AuthResponse> {
    try {
      const { data } = await client().post<GoogleUserResponse & AuthResponse>("/auth/google/register", {
        idToken,
        registrationRole,
      });
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null || data.email) setStoredUser(mapGoogleUserToStoredUser(data as GoogleUserResponse));
      return data;
    } catch (e) {
      throw toApiError(e, "Google ile kayıt başarısız");
    }
  },

  async fetchTwoFactorSetup(): Promise<TwoFactorSetupPayload> {
    const { data, status } = await client().post<TwoFactorSetupPayload | { message?: string }>(
      "/auth/2fa/setup",
      {},
      { validateStatus: () => true },
    );
    if (status !== 200 || !data) {
      const msg =
        typeof data === "object" && data != null && "message" in data && typeof data.message === "string"
          ? data.message
          : "2FA kurulumu alınamadı";
      throw new ApiError(status, msg, data);
    }
    const p = data as TwoFactorSetupPayload;
    if (
      typeof p.secret !== "string" ||
      typeof p.qrImageBase64 !== "string" ||
      typeof p.otpAuthUri !== "string"
    ) {
      throw new ApiError(status, "Geçersiz kurulum yanıtı", data);
    }
    return p;
  },

  async activateTwoFactor(code: string): Promise<void> {
    try {
      await client().post("/auth/2fa/active", { code });
    } catch (e) {
      throw toTotpSubmitApiError(e, "2FA doğrulaması başarısız");
    }
  },

  async disableTwoFactor(code: string): Promise<void> {
    try {
      await client().post("/auth/2fa/disable", { code });
    } catch (e) {
      throw toTotpSubmitApiError(e, "2FA kapatılamadı");
    }
  },
};
