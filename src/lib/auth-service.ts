import axios, { AxiosError } from "axios";
import { ApiError, setStoredUser } from "./api";
import {
  getJsonErrorText,
  isLikelyWrongTotpBackendText,
  TOTP_WRONG_USER_MESSAGE,
} from "./api-error-text";

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  /** JWT exp, saniye cinsinden epoch; client sayacı için */
  accessTokenExpiresAt?: number;
  /** AuthService TokenResponse (basicauth login / refresh) */
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
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
  const err = e as AxiosError<unknown>;
  const status = err.response?.status ?? 0;
  const from = getJsonErrorText(err.response?.data);
  const message = from || err.message || fallback;
  return new ApiError(status, message, err.response?.data);
}

/** 2FA kod yanlışsa (401 veya eski API’de 500 + errors içinde Invalid verification code) sade mesaj. */
function toTotpSubmitApiError(e: unknown, fallback: string): ApiError {
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

/** POST /api/auth/2fa/setup yanıtı (AuthService /2fa/setup). */
export interface TwoFactorSetupPayload {
  secret: string;
  issuer: string;
  accountLabel: string;
  qrImageBase64: string;
  otpAuthUri: string;
}

export const authService = {
  /** /api/auth/login → Gateway `/authservice/basicauth/login` (veya AUTH_UPSTREAM), cookie'ler set edilir */
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>("/api/auth/login", params, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
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

  /** /api/auth/register → `/authservice/basicauth/register` */
  async register(params: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>("/api/auth/register", params, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (data.user) setStoredUser(data.user);
      return data;
    } catch (e) {
      throw toApiError(e, "Kayıt başarısız");
    }
  },

  /** /api/auth/google/login → `/authservice/google-auth/login`. Body: düz idToken string */
  async googleLogin(idToken: string): Promise<GoogleUserResponse & AuthResponse> {
    try {
      const { data } = await axios.post<GoogleUserResponse & AuthResponse>("/api/auth/google/login", idToken, {
        headers: { "Content-Type": "text/plain" },
        transformRequest: [(d) => d],
        withCredentials: true,
      });
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null || data.email) setStoredUser(mapGoogleUserToStoredUser(data as GoogleUserResponse));
      return data;
    } catch (e) {
      throw toApiError(e, "Google ile giriş başarısız");
    }
  },

  /** /api/auth/google/register → `/authservice/google-auth/register` (JSON { idToken }) */
  async googleRegister(idToken: string): Promise<GoogleUserResponse & AuthResponse> {
    try {
      const { data } = await axios.post<GoogleUserResponse & AuthResponse>("/api/auth/google/register", idToken, {
        headers: { "Content-Type": "text/plain" },
        transformRequest: [(d) => d],
        withCredentials: true,
      });
      if (data.user) setStoredUser(data.user);
      else if (data.userId != null || data.email) setStoredUser(mapGoogleUserToStoredUser(data as GoogleUserResponse));
      return data;
    } catch (e) {
      throw toApiError(e, "Google ile kayıt başarısız");
    }
  },

  /** 2FA kurulumu: QR (Base64), gizli anahtar, otpauth URI (tek telefonda manuel / derin bağlantı). */
  async fetchTwoFactorSetup(): Promise<TwoFactorSetupPayload> {
    const res = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      credentials: "include",
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, (raw as { message?: string }).message || "2FA kurulumu alınamadı", raw);
    }
    const p = raw as TwoFactorSetupPayload;
    if (
      typeof p.secret !== "string" ||
      typeof p.qrImageBase64 !== "string" ||
      typeof p.otpAuthUri !== "string"
    ) {
      throw new ApiError(res.status, "Geçersiz kurulum yanıtı", raw);
    }
    return p;
  },

  /** 2FA'yı TOTP kodu ile aktif et. */
  async activateTwoFactor(code: string): Promise<void> {
    try {
      await axios.post("/api/auth/2fa/active", { code }, { withCredentials: true });
    } catch (e) {
      throw toTotpSubmitApiError(e, "2FA doğrulaması başarısız");
    }
  },

  /** 2FA'yı kapatmak için geçerli TOTP kodu gerekir. */
  async disableTwoFactor(code: string): Promise<void> {
    try {
      await axios.post("/api/auth/2fa/disable", { code }, { withCredentials: true });
    } catch (e) {
      throw toTotpSubmitApiError(e, "2FA kapatılamadı");
    }
  },
};
