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
import { Eye, EyeOff, Key, Mail, Timer } from "lucide-react";

type Step = "intro" | "code" | "password";

type RequestCodeResponse = {
  maskedEmail?: string;
  expiresInSeconds?: number;
  validityMinutes?: number;
};

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
  onSuccess: () => void;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onNotify,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [step, setStep] = useState<Step>("intro");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [validityMinutes, setValidityMinutes] = useState(5);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingLabel, setRemainingLabel] = useState("5:00");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("intro");
      setMaskedEmail("");
      setValidityMinutes(5);
      setExpiresAtMs(null);
      setRemainingLabel("5:00");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPass(false);
      setSending(false);
      setConfirming(false);
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

  const handleSendCode = async () => {
    setSending(true);
    try {
      const { data } = await getSiteSameOriginAxios().post<RequestCodeResponse>(
        "/account/password-change/request-code",
      );
      const minutes = data.validityMinutes ?? 5;
      const seconds = data.expiresInSeconds ?? minutes * 60;
      setMaskedEmail(data.maskedEmail ?? "");
      setValidityMinutes(minutes);
      setExpiresAtMs(Date.now() + seconds * 1000);
      setCode("");
      setStep("code");
      onNotify("info", `Doğrulama kodu ${data.maskedEmail ?? "e-posta adresinize"} gönderildi.`);
    } catch (e) {
      const detail =
        e instanceof ApiError
          ? getJsonErrorText(e.data) || e.message
          : getJsonErrorText((e as { response?: { data?: unknown } }).response?.data);
      onNotify("danger", detail || "Kod gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const handleContinueToPassword = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      onNotify("warning", "6 haneli doğrulama kodunu girin.");
      return;
    }
    if (expired || !expiresAtMs) {
      onNotify("warning", "Kodun süresi dolmuş. Yeni kod isteyin.");
      return;
    }
    setStep("password");
  };

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      onNotify("warning", "6 haneli doğrulama kodunu girin.");
      return;
    }
    if (newPassword.length < 8) {
      onNotify("warning", "Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify("warning", "Yeni şifre ile tekrarı eşleşmiyor.");
      return;
    }
    if (expired || !expiresAtMs) {
      onNotify("warning", "Kodun süresi dolmuş. Yeni kod isteyin.");
      setStep("code");
      return;
    }

    setConfirming(true);
    try {
      await getSiteSameOriginAxios().post("/account/password-change/confirm", {
        code: code.trim(),
        newPassword,
        confirmPassword,
      });
      onNotify("info", "Şifreniz güncellendi. Güvenliğiniz için tekrar giriş yapın.");
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      const detail =
        e instanceof ApiError
          ? getJsonErrorText(e.data) || e.message
          : getJsonErrorText((e as { response?: { data?: unknown } }).response?.data);
      onNotify("danger", detail || "Şifre güncellenemedi.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şifre Değiştir</DialogTitle>
          <DialogDescription>
            {step === "intro" &&
              `Şifrenizi değiştirmek için e-posta adresinize 6 haneli bir doğrulama kodu gönderilecektir. Kod ${validityMinutes} dakika geçerlidir.`}
            {step === "code" &&
              `E-posta adresinize (${maskedEmail || "****"}) gönderilen 6 haneli kodu girin.`}
            {step === "password" && "Yeni şifrenizi belirleyin."}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                Kod yalnızca kayıtlı e-posta adresinize gönderilir ve {validityMinutes} dakika içinde kullanılmalıdır.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="button" className="gap-2" onClick={handleSendCode} disabled={sending}>
                <Key className="h-4 w-4" />
                {sending ? "Gönderiliyor…" : "Kod Gönder"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "code" && (
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
              <Label className="text-xs text-muted-foreground">Doğrulama kodu</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="bg-background tracking-widest font-mono text-center text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={sending}
              >
                {sending ? "Gönderiliyor…" : "Yeniden Gönder"}
              </Button>
              <Button
                type="button"
                onClick={handleContinueToPassword}
                disabled={code.length !== 6 || expired}
              >
                Devam
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                Kod geçerliliği
              </span>
              <span className={`font-mono font-medium ${expired ? "text-destructive" : "text-foreground"}`}>
                {expired ? "Süre doldu" : remainingLabel}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Yeni Şifre</Label>
              <div className="relative">
                <Input
                  type={showNewPass ? "text" : "password"}
                  placeholder="En az 8 karakter"
                  className="bg-background pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-background"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("code")}>
                Geri
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={confirming || expired}>
                {confirming ? "Güncelleniyor…" : "Şifreyi Güncelle"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
