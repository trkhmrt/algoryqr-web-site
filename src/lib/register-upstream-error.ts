import { getJsonErrorText } from "@/lib/api-error-text";

/** AuthService kayıt yanıtı (JSON veya düz metin) → istemciye iletilecek mesaj. */
export function messageFromRegisterUpstream(rawBody: string, status: number): string {
  if (!rawBody?.trim()) return status === 409 ? "Bu e-posta zaten kayıtlı." : "Kayıt başarısız";
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    return getJsonErrorText(parsed) || rawBody.trim();
  } catch {
    return rawBody.trim();
  }
}
