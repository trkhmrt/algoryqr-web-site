import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { authService } from "@/lib/auth-service";
import { ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

const Login = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authService.login({ username, email, password });
      toast({ title: "Başarılı", description: "Giriş yapıldı!" });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Giriş yapılırken bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast({ title: "Hata", description: "Google kimlik doğrulama token'ı alınamadı.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await authService.googleLogin(idToken);
      toast({ title: "Başarılı", description: "Google ile giriş yapıldı!" });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Google ile giriş yapılırken bir hata oluştu";
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
            <h1 className="text-2xl font-bold">Hoş Geldiniz</h1>
            <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın veya yeni bir hesap oluşturun</p>
          </div>

          {/* Google Login */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => toast({ title: "Hata", description: "Google ile giriş başarısız.", variant: "destructive" })}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">veya</span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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

        <Link href="/dashboard" className="w-full">
            <Button variant="heroOutline" size="lg" className="w-full">
              Dashboard'a Git →
            </Button>
          </Link>

          <p className="text-center text-xs text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
