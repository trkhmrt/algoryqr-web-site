import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth-service";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { MY_PROFILE_QUERY_KEY } from "@/hooks/use-my-profile";
import { getGoogleAuthErrorMessage } from "@/lib/google-auth-error";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaiting2FA, setAwaiting2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorHintEmail, setTwoFactorHintEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const message = getGoogleAuthErrorMessage(error);
    if (!message) return;
    const show = window.setTimeout(() => {
      toast({ title: "Google ile giriş başarısız", description: message, variant: "destructive" });
      router.replace("/login");
    }, 0);
    return () => window.clearTimeout(show);
  }, [router, toast]);

  const cancelTwoFactor = async () => {
    await getSiteSameOriginAxios().post("/auth/logout", {}).catch(() => undefined);
    setAwaiting2FA(false);
    setTotpCode("");
    setTwoFactorHintEmail(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      if (data.requiresTwoFactor) {
        setTwoFactorHintEmail(data.email ?? email);
        setAwaiting2FA(true);
        setTotpCode("");
        toast({ title: "İki adımlı doğrulama", description: "Authenticator uygulamanızdaki 6 haneli kodu girin." });
        return;
      }
      queryClient.removeQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast({ title: "Başarılı", description: "Giriş yapıldı!" });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Giriş yapılırken bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = totpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "Hata", description: "6 haneli kodu girin.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authService.completeTwoFactorLogin(code);
      queryClient.removeQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      setAwaiting2FA(false);
      setTotpCode("");
      setTwoFactorHintEmail(null);
      toast({ title: "Başarılı", description: "Giriş yapıldı!" });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "2FA doğrulanamadı";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">

      <div className="relative z-10 w-full max-w-md px-4">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <QrCode className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">
            Algory<span className="text-primary">QR</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-8 space-y-6 glow-card">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{awaiting2FA ? "İki adımlı doğrulama" : "Hoş Geldiniz"}</h1>
            <p className="text-sm text-muted-foreground">
              {awaiting2FA
                ? twoFactorHintEmail
                  ? `${twoFactorHintEmail} için Authenticator kodunu girin.`
                  : "Authenticator uygulamanızdaki 6 haneli kodu girin."
                : "Hesabınıza giriş yapın veya yeni bir hesap oluşturun"}
            </p>
          </div>

          {awaiting2FA ? (
            <form onSubmit={handleSubmitTwoFactor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp">Doğrulama kodu</Label>
                <Input
                  id="totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="tracking-widest font-mono text-center text-lg"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading || totpCode.length !== 6}>
                {loading ? "Doğrulanıyor..." : "Devam et"}
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => void cancelTwoFactor()}>
                İptal
              </Button>
            </form>
          ) : (
            <>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <a href="/api/auth/google/start?intent=login">
                  <GoogleIcon className="h-5 w-5" />
                  Google ile giriş yap
                </a>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">veya</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </>
          )}

          {!awaiting2FA && (
            <p className="text-center text-xs text-muted-foreground">
              Hesabınız yok mu?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Kayıt Ol
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
