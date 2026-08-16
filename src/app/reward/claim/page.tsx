"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerLogin, customerMe } from "@/lib/customer-auth";
import {
  claimCampaignReward,
  fetchClaimInfo,
  type ClaimInfoResponse,
} from "@/lib/public-campaign-api";

function RewardClaimContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("c")?.trim() ?? "";
  const [info, setInfo] = useState<ClaimInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Geçersiz claim bağlantısı.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void Promise.all([fetchClaimInfo(token), customerMe()])
      .then(([claimInfo, me]) => {
        if (cancelled) return;
        setInfo(claimInfo);
        setLoggedIn(Boolean(me));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Claim bilgisi alınamadı.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function runClaim() {
    if (!token) return;
    setClaiming(true);
    setError(null);
    try {
      const result = await claimCampaignReward(token);
      setSuccessMessage(result.message ?? "Ödül hesabınıza tanımlandı.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim başarısız.");
    } finally {
      setClaiming(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setError(null);
    try {
      await customerLogin({ email, password });
      setLoggedIn(true);
      await runClaim();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Kampanya Ödülü</h1>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {successMessage ? (
          <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>
        ) : null}

        {info && !successMessage ? (
          <div className="mt-4 space-y-3 text-sm">
            {info.campaignName ? (
              <p className="font-medium">{info.campaignName}</p>
            ) : null}
            {info.message ? <p className="text-muted-foreground">{info.message}</p> : null}

            {info.alreadyClaimed || info.status === "CLAIMED" ? (
              <p className="text-emerald-600">Bu ödül zaten tanımlanmış.</p>
            ) : info.status === "EXPIRED" ? (
              <p className="text-destructive">Claim süresi dolmuş.</p>
            ) : loggedIn ? (
              <Button className="w-full" disabled={claiming} onClick={() => void runClaim()}>
                {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ödülü hesabıma tanımla"}
              </Button>
            ) : (
              <form className="space-y-3" onSubmit={(e) => void handleLogin(e)}>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-email">E-posta</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="claim-password">Şifre</Label>
                  <Input
                    id="claim-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={authBusy || claiming}>
                  {authBusy || claiming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Giriş yap ve ödülü al"
                  )}
                </Button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RewardClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RewardClaimContent />
    </Suspense>
  );
}
