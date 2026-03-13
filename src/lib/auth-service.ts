import axios, { AxiosError } from "axios";
import { ApiError, setStoredUser } from "./api";

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
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
  const err = e as AxiosError<{ message?: string }>;
  const status = err.response?.status ?? 0;
  const message = err.response?.data?.message ?? err.message ?? fallback;
  return new ApiError(status, message, err.response?.data);
}

export const authService = {
  /** /api/auth/login → basicauth/login proxy, token cookie'ye yazılır */
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>("/api/auth/login", params, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (data.user) setStoredUser(data.user);
      else if (params.email) setStoredUser({ id: params.email, email: params.email });
      return data;
    } catch (e) {
      throw toApiError(e, "Giriş başarısız");
    }
  },

  /** /api/auth/register → basicauth/register proxy, token cookie'ye yazılır */
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

  /** /api/auth/google/login → basicauth/google/login proxy, token cookie'ye yazılır. Body: sadece token string */
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

  /** /api/auth/google/register → basicauth/google/login proxy, token cookie'ye yazılır */
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
};
