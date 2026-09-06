const BASIC_ACCOUNT_GOOGLE_MESSAGE =
  "Bu e-posta adresi e-posta/şifre ile kayıtlı. Lütfen e-posta ve şifre ile giriş yapın.";

const GOOGLE_ACCOUNT_BASIC_MESSAGE =
  "Bu e-posta adresi Google ile kayıtlı. Lütfen Google ile giriş yapın.";

const PROVIDER_CONFLICT_FALLBACK =
  "Bu hesap farklı bir giriş yöntemiyle oluşturulmuş";

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google erişim izni verilmedi.",
  account_exists: "Bu Google hesabı veya e-posta adresi zaten kayıtlı.",
  account_exists_different_provider: BASIC_ACCOUNT_GOOGLE_MESSAGE,
  account_not_found: "Google hesabı kayıtlı değil. Önce kayıt olun.",
  auth_method_mismatch: BASIC_ACCOUNT_GOOGLE_MESSAGE,
  email_not_verified: "Google e-posta adresi doğrulanmamış.",
  google_auth_failed: "Google kimlik doğrulaması tamamlanamadı.",
  invalid_intent: "Google giriş isteği geçersiz.",
  invalid_ticket: "Google giriş bağlantısı geçersiz.",
  oauth_failed: "Google ile giriş tamamlanamadı.",
  provider_conflict: BASIC_ACCOUNT_GOOGLE_MESSAGE,
  registration_failed: "Google ile kayıt tamamlanamadı.",
  ticket_expired: "Google giriş bağlantısının süresi doldu.",
  ticket_used: "Google giriş bağlantısı daha önce kullanılmış.",
  upstream_unavailable: "Kimlik doğrulama servisine ulaşılamıyor.",
};

const PROVIDER_CONFLICT_CODES = new Set([
  "provider_conflict",
  "account_exists_different_provider",
  "auth_method_mismatch",
  "account_exists",
]);

export function normalizeGoogleAuthErrorCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.trim().toLowerCase();
}

export function isProviderConflictError(code: string | null | undefined): boolean {
  const normalized = normalizeGoogleAuthErrorCode(code);
  return Boolean(normalized && PROVIDER_CONFLICT_CODES.has(normalized));
}

export function isAuthMethodMismatchMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("e-posta/şifre") ||
    lower.includes("e-posta/sifre") ||
    lower.includes("e-posta ve şifre") ||
    lower.includes("e-posta ve sifre") ||
    lower.includes("google ile kayıtlı") ||
    lower.includes("google ile kayitli") ||
    lower.includes("farklı bir giriş") ||
    lower.includes("farkli bir giris") ||
    lower.includes("farklı yöntem") ||
    lower.includes("different provider") ||
    lower.includes("different method") ||
    lower.includes("already registered with") ||
    lower.includes("auth_method_mismatch") ||
    lower.includes("account_exists_different_provider") ||
    lower.includes("provider_conflict") ||
    lower.includes("şifre ile kayıtlı") ||
    lower.includes("sifre ile kayitli") ||
    lower.includes("password account")
  );
}

/** Prefer Google-account message when password login hits a Google user. */
export function resolveConflictMessageFromText(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("google ile kayıtlı") || lower.includes("google ile kayitli")) {
    return GOOGLE_ACCOUNT_BASIC_MESSAGE;
  }
  if (
    lower.includes("e-posta/şifre") ||
    lower.includes("e-posta/sifre") ||
    lower.includes("e-posta ve şifre") ||
    lower.includes("e-posta ve sifre")
  ) {
    return BASIC_ACCOUNT_GOOGLE_MESSAGE;
  }
  if (isAuthMethodMismatchMessage(message)) {
    return message.trim() || PROVIDER_CONFLICT_FALLBACK;
  }
  return message;
}

export function getProviderConflictMessage(): string {
  return BASIC_ACCOUNT_GOOGLE_MESSAGE;
}

export function getGoogleAccountBasicLoginMessage(): string {
  return GOOGLE_ACCOUNT_BASIC_MESSAGE;
}

export function getGoogleAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const normalized = normalizeGoogleAuthErrorCode(code);
  if (!normalized) return null;
  if (isProviderConflictError(normalized)) {
    return BASIC_ACCOUNT_GOOGLE_MESSAGE;
  }
  return GOOGLE_AUTH_ERROR_MESSAGES[normalized] ?? "Google kimlik doğrulaması tamamlanamadı.";
}

export function resolveCustomerAuthConflictMessage(input: {
  code?: string | null;
  message?: string | null;
}): string | null {
  if (input.message && isAuthMethodMismatchMessage(input.message)) {
    return resolveConflictMessageFromText(input.message);
  }
  if (isProviderConflictError(input.code)) {
    return BASIC_ACCOUNT_GOOGLE_MESSAGE;
  }
  if (isAuthMethodMismatchMessage(input.code)) {
    return BASIC_ACCOUNT_GOOGLE_MESSAGE;
  }
  return null;
}
