"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";

import LegalPageShell from "@/components/LegalPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { COMPANY } from "@/lib/company";

const Contact = () => {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast({ title: "Hata", description: "Lütfen zorunlu alanları doldurun.", variant: "destructive" });
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        fieldErrors?: Record<string, string>;
      } | null;

      if (!response.ok) {
        const fieldMessage = data?.fieldErrors
          ? Object.values(data.fieldErrors)[0]
          : undefined;
        toast({
          title: "Hata",
          description:
            fieldMessage || data?.message || "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Başarılı",
        description: data?.message || "Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.",
      });
      setForm({ firstName: "", lastName: "", email: "", message: "" });
    } catch {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <LegalPageShell title="İletişim" eyebrow="Bize ulaşın">
      <div className="not-prose grid gap-6 md:grid-cols-5">
        <div className="glass glow-card space-y-4 rounded-2xl border border-border/60 p-6 md:col-span-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Şirket</p>
          <h2 className="text-xl font-semibold text-foreground">{COMPANY.tradeName}</h2>
          <p className="text-sm text-muted-foreground">
            {COMPANY.productName} ürünü için destek ve satış sorularınızı e-posta ile
            iletebilirsiniz.
          </p>
          <a
            href={COMPANY.emailMailto}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4" />
            {COMPANY.email}
          </a>
        </div>

        <div className="glass glow-card rounded-2xl border border-border/60 p-6 md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">İsim</Label>
                <Input
                  id="firstName"
                  placeholder="Adınız"
                  value={form.firstName}
                  onChange={update("firstName")}
                  disabled={pending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyisim</Label>
                <Input
                  id="lastName"
                  placeholder="Soyadınız"
                  value={form.lastName}
                  onChange={update("lastName")}
                  disabled={pending}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-posta</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="ornek@email.com"
                value={form.email}
                onChange={update("email")}
                disabled={pending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mesaj (Opsiyonel)</Label>
              <Textarea
                id="message"
                placeholder="Mesajınızı yazın..."
                rows={4}
                value={form.message}
                onChange={update("message")}
                disabled={pending}
              />
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              type="submit"
              disabled={pending}
            >
              <Send className="h-4 w-4" /> {pending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </form>
        </div>
      </div>
    </LegalPageShell>
  );
};

export default Contact;
