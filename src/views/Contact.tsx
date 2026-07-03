import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    toast({ title: "Başarılı", description: "Mesajınız gönderildi. En kısa sürede size dönüş yapacağız." });
    setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      <div className="relative z-10 w-full max-w-lg px-4 py-16">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <QrCode className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">
            Algory<span className="text-primary">QR</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-8 space-y-6 glow-card">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">İletişim</h1>
            <p className="text-sm text-muted-foreground">Bizimle iletişime geçin, size yardımcı olalım</p>
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
              <Label htmlFor="contactEmail">E-posta</Label>
              <Input id="contactEmail" type="email" placeholder="ornek@email.com" value={form.email} onChange={update("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" placeholder="+90 5XX XXX XX XX" value={form.phone} onChange={update("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mesaj (Opsiyonel)</Label>
              <Textarea id="message" placeholder="Mesajınızı yazın..." rows={4} value={form.message} onChange={update("message")} />
            </div>
            <Button variant="hero" size="lg" className="w-full gap-2" type="submit">
              <Send className="h-4 w-4" /> Gönder
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="text-primary hover:underline font-medium">← Ana Sayfaya Dön</Link>
        </p>
      </div>
    </div>
  );
};

export default Contact;
