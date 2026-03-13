import { ApiError, api, noAuth, setTokens, clearTokens, setStoredUser } from "./api";

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
    const { data } = await api.post<GoogleUserResponse>("/basicauth/google/login", { idToken }, noAuth());
    setStoredUser(mapGoogleUserToStoredUser(data));
    return data;
  },

  /** Google OAuth — kayıt */
  async googleRegister(idToken: string): Promise<GoogleUserResponse> {
    const { data } = await api.post<GoogleUserResponse>("/auth/google/register", { idToken }, noAuth());
    setStoredUser(mapGoogleUserToStoredUser(data));
    return data;
  },

  /** Kullanıcı adı / e-posta / şifre ile giriş */
  async login(params: { username: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "include",
    });
    const data = (await res.json()) as AuthResponse & { message?: string };
    if (!res.ok) {
      throw new ApiError(res.status, data.message || "Giriş başarısız", data);
    }
    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    // httpOnly cookie SSR tarafta yazılıyor; sadece local fallback tutuyoruz.
    if (accessToken) setTokens(accessToken, refreshToken);
    if (data.user) {
      setStoredUser(data.user);
    } else if (params.email) {
      setStoredUser({
        id: params.email,
        email: params.email,
        first_name: params.username,
      });
    }
    return data;
  },

  /** Kayıt ol */
  async register(params: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", params, noAuth());
    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    if (accessToken) setTokens(accessToken, refreshToken);
    if (data.user) setStoredUser(data.user);
    return data;
  },

  /** Çıkış */
  logout() {
    clearTokens();
  },
};
