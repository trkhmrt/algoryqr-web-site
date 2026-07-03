import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import heroQr from "@/assets/hero-qr.png";

const marqueeItems = [
  "Dinamik QR", "Analitik", "Toplu Oluşturma", "Özel Tasarım", "API Erişimi",
  "Menü QR", "Ödeme QR", "Etkinlik QR", "Pazarlama", "Takip",
];

const MarqueeContent = () => (
  <>
    {marqueeItems.map((item, i) => (
      <span key={i} className="mx-6 text-sm text-muted-foreground font-medium flex-shrink-0 flex items-center gap-3">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        {item}
      </span>
    ))}
  </>
);

const HeroSection = () => {
  return (
    <section className="relative flex flex-col pt-32 pb-0">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground opacity-0 animate-fade-in">
              Smart QR Platform
            </p>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              QR kampanyalarınızı tek bir modern panelden yönetin.
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Menüler, ödemeler, etkinlikler ve pazarlama akışları için dinamik QR kodları oluşturun. Taramaları anlık takip edin.
            </p>

            <div className="flex items-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link href="/login">
                <Button variant="hero" size="lg" className="gap-2">
                  QR Oluştur <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="heroOutline" size="lg">
                  Şablonları Gör
                </Button>
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <img src={heroQr.src} alt="AlgoryQR Code" className="w-56 md:w-72" />
          </div>
        </div>
      </div>

      {/* Marquee - seamless infinite scroll */}
      <div className="mt-24 border-t border-b border-border overflow-hidden relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
        
        <div className="flex py-4 marquee-track">
          <div className="flex shrink-0 animate-marquee">
            <MarqueeContent />
            <MarqueeContent />
          </div>
          <div className="flex shrink-0 animate-marquee">
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
