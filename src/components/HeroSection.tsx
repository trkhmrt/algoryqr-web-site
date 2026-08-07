import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const marqueeItems = [
  "Dinamik QR",
  "Dijital Menü",
  "Akıllı Özet",
  "Akıllı Asistan",
  "Akıllı Raporlama",
  "Analitik",
  "Menü QR",
  "Özel Tasarım",
  "Toplu Oluşturma",
  "Anlık Takip",
];

const MarqueeContent = () => (
  <>
    {marqueeItems.map((item, i) => (
      <span
        key={i}
        className="mx-4 sm:mx-6 text-xs sm:text-sm text-muted-foreground font-medium shrink-0 flex items-center gap-2 sm:gap-3"
      >
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        {item}
      </span>
    ))}
  </>
);

const HeroSection = () => {
  return (
    <section className="relative flex flex-col pt-[max(5.5rem,12vw)] pb-0">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl space-y-5 sm:space-y-7 md:space-y-8">
          <p className="text-[0.7rem] sm:text-sm font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em] text-muted-foreground opacity-0 animate-fade-in">
            QR · Dijital Menü · Yapay Zeka
          </p>

          <h1
            className="font-bold text-foreground opacity-0 animate-fade-in break-words text-balance"
            style={{
              animationDelay: "0.1s",
              fontSize: "clamp(1.875rem, 1.1rem + 3.6vw, 4.5rem)",
              lineHeight: 1.1,
            }}
          >
            AlgoryQR ile menünüzü ve kampanyalarınızı akıllıca yönetin.
          </h1>

          <p
            className="text-muted-foreground max-w-lg leading-relaxed opacity-0 animate-fade-in text-pretty"
            style={{
              animationDelay: "0.2s",
              fontSize: "clamp(0.95rem, 0.85rem + 0.4vw, 1.125rem)",
            }}
          >
            Dinamik QR kodlar ve dijital menü; Akıllı Özet, Akıllı Asistan ve Akıllı Raporlama ile içerik üretiminden performansa kadar tek panelde.
          </p>

          <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-3 sm:gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link href="/register" className="w-full min-[420px]:w-auto">
              <Button variant="hero" size="lg" className="w-full min-[420px]:w-auto gap-2 min-h-11">
                Ücretsiz Başla <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features" className="w-full min-[420px]:w-auto">
              <Button variant="heroOutline" size="lg" className="w-full min-[420px]:w-auto min-h-11">
                Özellikleri Gör
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(2.5rem,6vw,6rem)] border-t border-b border-border overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex py-3 sm:py-4 marquee-track">
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
