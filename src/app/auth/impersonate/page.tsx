"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setStoredUser } from "@/lib/api";

function readHashParams() {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(raw);
}

export default function ImpersonatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const params = readHashParams();
      const accessToken = params.get("accessToken")?.trim();
      const refreshToken = params.get("refreshToken")?.trim();
      const userIdRaw = params.get("userId")?.trim();
      const email = params.get("email")?.trim();
      const firstName = params.get("firstName")?.trim();
      const lastName = params.get("lastName")?.trim();
      const userId = userIdRaw ? Number(userIdRaw) : NaN;

      if (!accessToken || !refreshToken || !Number.isFinite(userId)) {
        setError("Geçersiz veya eksik oturum bilgisi.");
        return;
      }

      try {
        const res = await fetch("/api/auth/impersonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, refreshToken, userId }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          setError(data?.message ?? "Oturum başlatılamadı.");
          return;
        }

        if (email) {
          setStoredUser({
            id: String(userId),
            email,
            first_name: firstName,
            last_name: lastName,
          });
        }

        window.history.replaceState(null, "", "/auth/impersonate");
        router.replace("/dashboard");
      } catch {
        setError("Oturum başlatılırken bir hata oluştu.");
      }
    }

    bootstrap();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-3 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold">Üye girişi başarısız</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Üye hesabına giriş yapılıyor…</p>
          </>
        )}
      </div>
    </main>
  );
}
