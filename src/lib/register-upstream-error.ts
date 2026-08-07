import { getJsonErrorText } from "@/lib/api-error-text";

export const EMAIL_ALREADY_REGISTERED_MESSAGE = "Bu e-posta adresi zaten kayıtlı.";

function looksLikeDuplicateEmail(text: string): boolean {
  const t = text.toLowerCase();
  return (
    ((t.includes("email") || t.includes("e-posta") || t.includes("eposta")) &&
      (t.includes("already") ||
        t.includes("exist") ||
        t.includes("duplicate") ||
        t.includes("zaten") ||
        t.includes("kayıtlı") ||
        t.includes("kayitli") ||
        t.includes("taken") ||
        t.includes("in use"))) ||
    t.includes("user already") ||
    t.includes("account already")
  );
}

/** AuthService kayıt yanıtı (JSON veya düz metin) → istemciye iletilecek mesaj. */
export function messageFromRegisterUpstream(rawBody: string, status: number): string {
  if (status === 409) return EMAIL_ALREADY_REGISTERED_MESSAGE;
  if (!rawBody?.trim()) return "Kayıt başarısız";
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const fromJson = getJsonErrorText(parsed);
    if (fromJson && looksLikeDuplicateEmail(fromJson)) return EMAIL_ALREADY_REGISTERED_MESSAGE;
    if (fromJson) return fromJson;
    return "Kayıt başarısız";
  } catch {
    const plain = rawBody.trim();
    if (looksLikeDuplicateEmail(plain)) return EMAIL_ALREADY_REGISTERED_MESSAGE;
    return plain || "Kayıt başarısız";
  }
}
