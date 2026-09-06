"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomerAuthError,
  customerGoogleStartUrl,
  customerLogin,
  customerRegister,
  joinCustomerMembership,
} from "@/lib/customer-auth";

import { useMenuLocaleOptional } from "./menu-locale";

type Mode = "login" | "register";

type CustomerAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicId: string;
  onSuccess: () => void | Promise<void>;
  onContinueAsGuest?: () => void;
  initialMode?: Mode;
};

export function CustomerAuthDialog({
  open,
  onOpenChange,
  publicId,
  onSuccess,
  onContinueAsGuest,
  initialMode = "login",
}: CustomerAuthDialogProps) {
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl = typeof window !== "undefined" ? window.location.href : undefined;

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
    }
  }, [open, initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await customerLogin({ email, password, publicId });
      } else {
        await customerRegister({
          firstName,
          lastName,
          email,
          password,
          passwordConfirm,
          publicId,
        });
      }
      try {
        await joinCustomerMembership(publicId);
      } catch {
        /* membership may already exist */
      }
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof CustomerAuthError
          ? err.message
          : t?.failed || "İşlem başarısız",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[100] max-h-[90dvh] max-w-sm overflow-y-auto"
        overlayClassName="z-[100]"
        dir={locale?.dir}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "login"
              ? t?.loginTitle || "Giriş yap"
              : t?.registerTitle || "Kayıt ol"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? t?.loginDescription || "Hesabınıza giriş yapın."
              : t?.registerDescription || "Sadakat ve sipariş geçmişi için üye olun."}
          </DialogDescription>
        </DialogHeader>

        <a
          href={customerGoogleStartUrl(
            mode === "login" ? "customer_login" : "customer_register",
            returnUrl,
          )}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <GoogleIcon />
          {mode === "login"
            ? t?.googleLogin || "Google ile giriş yap"
            : t?.googleRegister || "Google ile kayıt ol"}
        </a>

        <div className="relative py-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="relative z-10 bg-background px-2">
            {mode === "login" ? t?.login || "Giriş yap" : t?.register || "Kayıt ol"}
          </span>
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t?.firstName || "Ad"}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t?.lastName || "Soyad"}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
          ) : null}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t?.email || "E-posta"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t?.password || "Şifre"}
            minLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {mode === "register" ? (
            <input
              required
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t?.passwordConfirm || "Şifre tekrar"}
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? t?.login || "Giriş yap" : t?.register || "Kayıt ol"}
          </button>
        </form>

        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground underline"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login"
            ? t?.noAccount || "Hesabınız yok mu? Kayıt ol"
            : t?.hasAccount || "Zaten üye misiniz? Giriş yap"}
        </button>

        {onContinueAsGuest ? (
          <button
            type="button"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
            onClick={() => {
              onOpenChange(false);
              onContinueAsGuest();
            }}
          >
            {t?.continueAsGuest || "Misafir olarak devam et"}
          </button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
