const PROVIDER_CONFLICT_MESSAGE =
  "Bu e-posta şifre (BASIC) ile kayıtlı. Google yerine e-posta ve şifrenizle giriş yapın.";

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google erişim izni verilmedi.",
  account_exists: "Bu Google hesabı veya e-posta adresi zaten kayıtlı.",
  account_exists_different_provider: PROVIDER_CONFLICT_MESSAGE,
  account_not_found: "Google hesabı kayıtlı değil. Önce kayıt olun.",
  auth_method_mismatch: PROVIDER_CONFLICT_MESSAGE,
  email_not_verified: "Google e-posta adresi doğrulanmamış.",
  google_auth_failed: "Google kimlik doğrulaması tamamlanamadı.",
  invalid_intent: "Google giriş isteği geçersiz.",
  invalid_ticket: "Google giriş bağlantısı geçersiz.",
  oauth_failed: "Google ile giriş tamamlanamadı.",
  provider_conflict: PROVIDER_CONFLICT_MESSAGE,
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

/** Normalize upstream codes such as ACCOUNT_EXISTS_DIFFERENT_PROVIDER. */
export function normalizeGoogleAuthErrorCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.trim().toLowerCase();
}

export function isProviderConflictError(code: string | null | undefined): boolean {
  const normalized = normalizeGoogleAuthErrorCode(code);
  return Boolean(normalized && PROVIDER_CONFLICT_CODES.has(normalized));
}

/**
 * Detect provider / auth-method mismatch from free-form API messages
 * (Turkish or English) when a structured code is missing.
 */
export function isAuthMethodMismatchMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("farklı bir giriş") ||
    lower.includes("farkli bir giris") ||
    lower.includes("farklı yöntem") ||
    lower.includes("farkli yontem") ||
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

export function getProviderConflictMessage(): string {
  return PROVIDER_CONFLICT_MESSAGE;
}

export function getGoogleAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const normalized = normalizeGoogleAuthErrorCode(code);
  if (!normalized) return null;
  if (isProviderConflictError(normalized)) {
    return PROVIDER_CONFLICT_MESSAGE;
  }
  return GOOGLE_AUTH_ERROR_MESSAGES[normalized] ?? "Google kimlik doğrulaması tamamlanamadı.";
}

/** Prefer structured code, then free-form message heuristics. */
export function resolveCustomerAuthConflictMessage(input: {
  code?: string | null;
  message?: string | null;
}): string | null {
  if (isProviderConflictError(input.code)) {
    return PROVIDER_CONFLICT_MESSAGE;
  }
  const fromCode = getGoogleAuthErrorMessage(input.code ?? null);
  if (fromCode && isProviderConflictError(input.code)) {
    return fromCode;
  }
  if (isAuthMethodMismatchMessage(input.message) || isAuthMethodMismatchMessage(input.code)) {
    return PROVIDER_CONFLICT_MESSAGE;
  }
  return null;
}
