"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { WaiterApiError, waiterLogin } from "@/lib/waiter-api";

export default function WaiterLoginView() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await waiterLogin({ username: username.trim(), password });
      router.replace(DASHBOARD_ROUTES.waiterPanel);
    } catch (err) {
      setError(err instanceof WaiterApiError ? err.message : "Giriş başarısız");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sipariş Paneli</h1>
          <p className="text-sm text-muted-foreground">Kullanıcı adı ve şifrenizle giriş yapın</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="waiter-login-username">Kullanıcı adı</Label>
            <Input
              id="waiter-login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waiter-login-password">Şifre</Label>
            <Input
              id="waiter-login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Giriş"}
          </Button>
        </form>
      </div>
    </div>
  );
}
