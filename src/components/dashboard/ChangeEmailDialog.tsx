"use client";

import { useEffect, useState } from "react";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { getJsonErrorText } from "@/lib/api-error-text";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Timer } from "lucide-react";

type Step = "intro" | "current-code" | "new-email" | "new-code";

type CodeResponse = {
  challengeId?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  validityMinutes?: number;
};

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
  onSuccess: () => void;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    return getJsonErrorText(e.data) || e.message || fallback;
  }
  return getJsonErrorText((e as { response?: { data?: unknown } }).response?.data) || fallback;
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
  onNotify,
  onSuccess,
}: ChangeEmailDialogProps) {
  const [step, setStep] = useState<Step>("intro");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [validityMinutes, setValidityMinutes] = useState(5);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingLabel, setRemainingLabel] = useState("5:00");
  const [currentCode, setCurrentCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("intro");
      setChallengeId("");
      setMaskedEmail("");
      setValidityMinutes(5);
      setExpiresAtMs(null);
      setRemainingLabel("5:00");
      setCurrentCode("");
      setNewEmail("");
      setNewCode("");
      setLoading(false);
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!expiresAtMs) return;
    const tick = () => {
      const remaining = expiresAtMs - Date.now();
      setRemainingLabel(formatRemaining(remaining));
      if (remaining <= 0) {
        setExpiresAtMs(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAtMs]);

  const expired = expiresAtMs != null && expiresAtMs <= Date.now();

  const applyCodeResponse = (data: CodeResponse) => {
    const minutes = data.validityMinutes ?? 5;
    const seconds = data.expiresInSeconds ?? minutes * 60;
    setChallengeId(data.challengeId ?? "");
    setMaskedEmail(data.maskedEmail ?? "");
    setValidityMinutes(minutes);
    if (seconds > 0) {
      setExpiresAtMs(Date.now() + seconds * 1000);
    } else {
      setExpiresAtMs(null);
    }
  };

  const handleSendCurrentCode = async () => {
    setLoading(true);
    try {
      const { data } = await getSiteSameOriginAxios().post<CodeResponse>(
        "/account/email-change/request-current-code",
      );
      applyCodeResponse(data);
      setCurrentCode("");
      setStep("current-code");
      onNotify("info", `Doğrulama kodu ${data.maskedEmail ?? "mevcut e-posta adresinize"} gönderildi.`);
    } catch (e) {
      onNotify("danger", getErrorMessage(e, "Kod gönderilemedi."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCurrent = async () => {
    if (!/^\d{6}$/.test(currentCode.trim())) {
      onNotify("warning", "6 haneli doğrulama kodunu girin.");
      return;
    }
    if (expired || !expiresAtMs) {
      onNotify("warning", "Kodun süresi dolmuş. Yeni kod isteyin.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await getSiteSameOriginAxios().post<CodeResponse>(
        "/account/email-change/verify-current",
        { challengeId, code: currentCode.trim() },
      );
      setChallengeId(data.challengeId ?? challengeId);
      setExpiresAtMs(null);
      setStep("new-email");
      onNotify("info", "Mevcut e-posta doğrulandı. Yeni e-posta adresinizi girin.");
    } catch (e) {
      onNotify("danger", getErrorMessage(e, "Doğrulama başarısız."));
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewCode = async () => {
    const email = newEmail.trim().toLowerCase();
    setFormError(null);
    if (!email || !email.includes("@")) {
      setFormError("Geçerli bir e-posta adresi girin.");
      return;
    }
    const current = currentEmail.trim().toLowerCase();
    if (!current) {
      setFormError("Mevcut e-posta bulunamadı.");
      return;
    }
    if (email === current) {
      const sameMsg = "Bu e-postalar aynı.";
      setFormError(sameMsg);
      onNotify("warning", sameMsg);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getSiteSameOriginAxios().post<CodeResponse>(
        "/account/email-change/request-new-code",
        { challengeId, currentEmail: current, newEmail: email },
      );
      applyCodeResponse(data);
      setNewCode("");
      setFormError(null);
      setStep("new-code");
      onNotify("info", `Doğrulama kodu ${data.maskedEmail ?? "yeni e-posta adresinize"} gönderildi.`);
    } catch (e) {
      const message = getErrorMessage(e, "Kod gönderilemedi.");
      setFormError(message);
      onNotify("danger", message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setFormError(null);
    if (!/^\d{6}$/.test(newCode.trim())) {
      setFormError("6 haneli doğrulama kodunu girin.");
      return;
    }
    if (expired || !expiresAtMs) {
      setFormError("Kodun süresi dolmuş. Yeni kod isteyin.");
      return;
    }
    setLoading(true);
    try {
      await getSiteSameOriginAxios().post("/account/email-change/confirm", {
        challengeId,
        code: newCode.trim(),
      });
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      const message = getErrorMessage(e, "E-posta güncellenemedi.");
      setFormError(message);
      onNotify("danger", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>E-posta Değiştir</DialogTitle>
          <DialogDescription>
            {step === "intro" &&
              `Önce mevcut e-posta adresinize (${currentEmail || "—"}) 6 haneli bir kod gönderilir. Sonra yeni e-posta için ikinci bir kod doğrulanır. Kodlar ${validityMinutes} dakika geçerlidir.`}
            {step === "current-code" &&
              `Mevcut e-posta adresinize (${maskedEmail || currentEmail}) gönderilen kodu girin.`}
            {step === "new-email" && "Yeni e-posta adresinizi girin. Bu adrese doğrulama kodu gönderilecektir."}
            {step === "new-code" &&
              `Yeni e-posta adresinize (${maskedEmail || newEmail}) gönderilen kodu girin.`}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                İki adımlı doğrulama: önce eski e-posta, ardından yeni e-posta onaylanır.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="button" onClick={handleSendCurrentCode} disabled={loading}>
                {loading ? "Gönderiliyor…" : "Mevcut E-postaya Kod Gönder"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "current-code" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                Kalan süre
              </span>
              <span className={`font-mono font-medium ${expired ? "text-destructive" : "text-foreground"}`}>
                {expired ? "Süre doldu" : remainingLabel}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mevcut e-posta doğrulama kodu</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="bg-background tracking-widest font-mono text-center text-lg"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleSendCurrentCode} disabled={loading}>
                {loading ? "Gönderiliyor…" : "Yeniden Gönder"}
              </Button>
              <Button
                type="button"
                onClick={handleVerifyCurrent}
                disabled={loading || currentCode.length !== 6 || expired}
              >
                {loading ? "Doğrulanıyor…" : "Doğrula"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "new-email" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Yeni e-posta</Label>
              <Input
                type="email"
                placeholder="yeni@ornek.com"
                className={`bg-background ${formError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                autoComplete="email"
                aria-invalid={Boolean(formError)}
              />
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--destructive))_12%)] px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormError(null);
                  setStep("current-code");
                }}
              >
                Geri
              </Button>
              <Button type="button" onClick={handleSendNewCode} disabled={loading || !newEmail.trim()}>
                {loading ? "Gönderiliyor…" : "Yeni E-postaya Kod Gönder"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "new-code" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                Kalan süre
              </span>
              <span className={`font-mono font-medium ${expired ? "text-destructive" : "text-foreground"}`}>
                {expired ? "Süre doldu" : remainingLabel}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Yeni e-posta doğrulama kodu</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className={`bg-background tracking-widest font-mono text-center text-lg ${formError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={newCode}
                onChange={(e) => {
                  setNewCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (formError) setFormError(null);
                }}
                aria-invalid={Boolean(formError)}
              />
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-[color-mix(in_srgb,hsl(var(--card))_88%,hsl(var(--destructive))_12%)] px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleSendNewCode} disabled={loading}>
                {loading ? "Gönderiliyor…" : "Yeniden Gönder"}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={loading || newCode.length !== 6 || expired}
              >
                {loading ? "Güncelleniyor…" : "E-postayı Güncelle"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
