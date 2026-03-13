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

export const authService = {
  /** Google OAuth — giriş */
  async googleLogin(idToken: string): Promise<GoogleUserResponse> {
    const { data } = await axios.post<GoogleUserResponse>("/api/auth/google/login", { idToken }, { withCredentials: true });
    setStoredUser(mapGoogleUserToStoredUser(data));
    return data;
  },

  /** Google OAuth — kayıt */
  async googleRegister(idToken: string): Promise<GoogleUserResponse> {
    const { data } = await axios.post<GoogleUserResponse>("/api/auth/google/register", { idToken }, { withCredentials: true });
    setStoredUser(mapGoogleUserToStoredUser(data));
    return data;
  },

  /** E-posta / şifre ile giriş */
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>("/api/auth/login", params, { withCredentials: true });
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
      const { data } = await axios.post<AuthResponse>("/api/auth/register", params, { withCredentials: true });
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
