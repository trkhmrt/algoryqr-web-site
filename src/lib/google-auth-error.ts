const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google erişim izni verilmedi.",
  account_exists: "Bu Google hesabı veya e-posta adresi zaten kayıtlı.",
  account_not_found: "Google hesabı kayıtlı değil. Önce kayıt olun.",
  email_not_verified: "Google e-posta adresi doğrulanmamış.",
  google_auth_failed: "Google kimlik doğrulaması tamamlanamadı.",
  invalid_intent: "Google giriş isteği geçersiz.",
  invalid_ticket: "Google giriş bağlantısı geçersiz.",
  oauth_failed: "Google ile giriş tamamlanamadı.",
  provider_conflict: "Bu e-posta farklı bir giriş yöntemiyle kayıtlı.",
  registration_failed: "Google ile kayıt tamamlanamadı.",
  ticket_expired: "Google giriş bağlantısının süresi doldu.",
  ticket_used: "Google giriş bağlantısı daha önce kullanılmış.",
  upstream_unavailable: "Kimlik doğrulama servisine ulaşılamıyor.",
};

export function getGoogleAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return GOOGLE_AUTH_ERROR_MESSAGES[code] ?? "Google kimlik doğrulaması tamamlanamadı.";
}
