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

const Register = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phone,
        password: form.password,
      });
      toast({ title: "Başarılı", description: "Hesabınız oluşturuldu!" });
      router.push("/");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Kayıt olurken bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast({ title: "Hata", description: "Google kimlik doğrulama token'ı alınamadı.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await authService.googleRegister(idToken);
      toast({ title: "Başarılı", description: "Google ile kayıt yapıldı!" });
      router.push("/");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Google ile kayıt yapılırken bir hata oluştu";
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
            <h1 className="text-2xl font-bold">Kayıt Ol</h1>
            <p className="text-sm text-muted-foreground">Ücretsiz hesabınızı oluşturun</p>
          </div>

          {/* Google Register */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleRegisterSuccess}
              onError={() => toast({ title: "Hata", description: "Google ile kayıt başarısız.", variant: "destructive" })}
              theme="outline"
              size="large"
              text="signup_with"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">İsim</Label>
                <Input id="firstName" placeholder="Adınız" value={form.firstName} onChange={update("firstName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyisim</Label>
                <Input id="lastName" placeholder="Soyadınız" value={form.lastName} onChange={update("lastName")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regEmail">E-posta</Label>
              <Input id="regEmail" type="email" placeholder="ornek@email.com" value={form.email} onChange={update("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPhone">Telefon</Label>
              <Input id="regPhone" type="tel" placeholder="+90 5XX XXX XX XX" value={form.phone} onChange={update("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">Şifre</Label>
              <Input id="regPassword" type="password" placeholder="••••••••" value={form.password} onChange={update("password")} />
            </div>
            <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
