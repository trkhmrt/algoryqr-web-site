import axios, { AxiosError } from "axios";
import { ApiError, setStoredUser } from "./api";
import { API_BASE } from "./config";

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

export const authService = {
  /** Google OAuth — giriş (doğrudan auth.algorycode.com) */
  async googleLogin(idToken: string): Promise<GoogleUserResponse & AuthResponse> {
    try {
      const { data } = await axios.post<GoogleUserResponse & AuthResponse>(`${API_BASE}/basicauth/google/login`, idToken, {
        headers: { "Content-Type": "text/plain" },
        transformRequest: [(data) => data],
        withCredentials: true,
      });
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (!accessToken && !refreshToken) {
        throw new ApiError(500, "Google giriş yanıtında token bulunamadı.");
      }

      if (data.user) {
        setStoredUser(data.user);
      } else if (data.userId != null || data.email) {
        setStoredUser(mapGoogleUserToStoredUser(data as GoogleUserResponse));
      }
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status || 0;
      const message = axiosError.response?.data?.message || axiosError.message || "Google ile giriş başarısız";
      throw new ApiError(status, message, axiosError.response?.data);
    }
  },

  /** Google OAuth — kayıt */
  async googleRegister(idToken: string): Promise<GoogleUserResponse> {
    try {
      const { data } = await axios.post<GoogleUserResponse>(`${API_BASE}/auth/google/register`, { idToken }, { withCredentials: true });
      setStoredUser(mapGoogleUserToStoredUser(data));
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status || 0;
      const message = axiosError.response?.data?.message || axiosError.message || "Google ile kayıt başarısız";
      throw new ApiError(status, message, axiosError.response?.data);
    }
  },

  /** E-posta / şifre ile giriş */
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>(`${API_BASE}/basicauth/login`, params, { withCredentials: true });
      if (data.user) {
        setStoredUser(data.user);
      } else if (params.email) {
        setStoredUser({
          id: params.email,
          email: params.email,
        });
      }
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status || 0;
      const message = axiosError.response?.data?.message || axiosError.message || "Giriş başarısız";
      throw new ApiError(status, message, axiosError.response?.data);
    }
  },

  /** Kayıt ol */
  async register(params: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>(`${API_BASE}/basicauth/register`, params, { withCredentials: true });
      if (data.user) setStoredUser(data.user);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status || 0;
      const message = axiosError.response?.data?.message || axiosError.message || "Kayıt başarısız";
      throw new ApiError(status, message, axiosError.response?.data);
    }
  },
};
