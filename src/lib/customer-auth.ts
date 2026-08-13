export type CustomerProfile = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  provider?: string | null;
  avatarKey?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CustomerAuthResult = {
  accessToken?: string;
  refreshToken?: string;
  customerId?: number;
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export class CustomerAuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function customerLogin(payload: {
  email: string;
  password: string;
  menuId?: number;
}): Promise<CustomerAuthResult> {
  const response = await fetch("/api/customer/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const data = await parseJson<CustomerAuthResult & { message?: string }>(response);
  if (!response.ok) {
    throw new CustomerAuthError(response.status, data.message || "Giriş başarısız");
  }
  return data;
}

export async function customerRegister(payload: {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  passwordConfirm: string;
  menuId?: number;
}): Promise<CustomerAuthResult> {
  const response = await fetch("/api/customer/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const data = await parseJson<CustomerAuthResult & { message?: string }>(response);
  if (!response.ok) {
    throw new CustomerAuthError(response.status, data.message || "Kayıt başarısız");
  }
  return data;
}

export async function customerLogout(): Promise<void> {
  await fetch("/api/customer/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export async function customerMe(): Promise<CustomerProfile | null> {
  const response = await fetch("/api/customer/auth/me", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (response.status === 401) return null;
  const data = await parseJson<CustomerProfile & { message?: string }>(response);
  if (!response.ok) {
    throw new CustomerAuthError(response.status, data.message || "Profil alınamadı");
  }
  return data;
}

export async function updateCustomerProfile(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<CustomerProfile> {
  const response = await fetch("/api/customer/account/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const data = await parseJson<CustomerProfile & { message?: string }>(response);
  if (!response.ok) {
    throw new CustomerAuthError(response.status, data.message || "Profil güncellenemedi");
  }
  return data;
}

export async function changeCustomerPassword(payload: {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}): Promise<void> {
  const response = await fetch("/api/customer/account/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await parseJson<{ message?: string }>(response);
    throw new CustomerAuthError(response.status, data.message || "Şifre değiştirilemedi");
  }
}

export async function joinCustomerMembership(menuId: number): Promise<void> {
  const response = await fetch("/api/customer/account/memberships/join", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ menuId }),
    credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await parseJson<{ message?: string }>(response);
    throw new CustomerAuthError(response.status, data.message || "Üyelik eklenemedi");
  }
}

export function customerGoogleStartUrl(
  intent: "customer_login" | "customer_register",
  returnUrl?: string,
): string {
  const params = new URLSearchParams({ intent });
  if (returnUrl) params.set("returnUrl", returnUrl);
  return `/api/customer/auth/google/start?${params.toString()}`;
}
