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
import { WaiterApiError, waiterLogin } from "@/lib/waiter-api";

import { useMenuLocaleOptional } from "./menu-locale";

type WaiterAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WaiterAuthDialog({ open, onOpenChange }: WaiterAuthDialogProps) {
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setUsername("");
      setPassword("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await waiterLogin({ username: username.trim(), password });
      window.location.href = "/waiter";
    } catch (err) {
      setError(
        err instanceof WaiterApiError
          ? err.message
          : t?.failed || "İşlem başarısız",
      );
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir={locale?.dir}>
        <DialogHeader>
          <DialogTitle>{t?.waiterLoginTitle || "Garson girişi"}</DialogTitle>
          <DialogDescription>
            {t?.waiterLoginDescription || "Kullanıcı adı ve şifrenizle giriş yapın."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t?.username || "Kullanıcı adı"}
            autoComplete="username"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t?.password || "Şifre"}
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t?.waiterLogin || "Garson girişi"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
