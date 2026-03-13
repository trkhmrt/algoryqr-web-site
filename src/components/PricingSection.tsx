import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Ücretsiz",
    price: "₺0",
    description: "Başlamak için ideal",
    features: ["5 QR kod", "Temel analitik", "Standart tasarım"],
    cta: "Ücretsiz Başla",
    featured: false,
  },
  {
    name: "Pro",
    price: "₺99",
    period: "/ay",
    description: "Büyüyen işletmeler için",
    features: ["Sınırsız QR kod", "Detaylı analitik", "Özel tasarımlar", "Toplu oluşturma", "Öncelikli destek"],
    cta: "Pro'ya Geç",
    featured: true,
  },
  {
    name: "Kurumsal",
    price: "İletişim",
    description: "Büyük ölçekli kullanım",
    features: ["Her şey Pro'da dahil", "API erişimi", "SSO entegrasyonu", "Özel SLA", "Özel hesap yöneticisi"],
    cta: "İletişime Geç",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-mono text-primary uppercase tracking-widest">Fiyatlandırma</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Basit & <span className="text-gradient">Şeffaf</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col ${
                plan.featured
                  ? "border-2 border-primary/50 bg-card glow-card relative"
                  : "glass"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Popüler
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/login">
                <Button
                  variant={plan.featured ? "hero" : "heroOutline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
