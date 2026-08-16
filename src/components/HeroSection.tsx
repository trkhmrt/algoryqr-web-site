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
        className="mx-4 sm:mx-6 shrink-0 whitespace-nowrap text-lg font-bold text-muted-foreground flex items-center gap-2 sm:gap-3"
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
        <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] sm:gap-8 md:gap-10 lg:gap-14 xl:gap-16">
          <div className="order-1 mx-auto w-full max-w-xl space-y-5 text-center sm:order-none sm:mx-0 sm:max-w-none sm:space-y-6 sm:text-left md:space-y-7 lg:space-y-8">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground opacity-0 animate-fade-in">
              QR · Dijital Menü · Yapay Zeka
            </p>

            <h1
              className="text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.92] font-extrabold opacity-0 animate-fade-in break-words text-balance sm:mt-2"
              style={{ animationDelay: "0.1s" }}
            >
              AlgoryQR ile menünüzü ve kampanyalarınızı akıllıca yönetin.
            </h1>

            <p
              className="mx-auto max-w-lg text-base text-muted-foreground leading-relaxed opacity-0 animate-fade-in text-pretty sm:mx-0 sm:text-lg"
              style={{ animationDelay: "0.2s" }}
            >
              Dinamik QR kodlar ve dijital menü; Akıllı Özet, Akıllı Asistan ve Akıllı Raporlama ile içerik üretiminden performansa kadar tek panelde.
            </p>

            <div
              className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center justify-center gap-3 sm:justify-start sm:gap-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/register" className="w-full min-[420px]:w-auto">
                <Button variant="hero" size="lg" className="w-full min-[420px]:w-auto gap-2 min-h-11">
                  Ücretsiz Başla <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#why-us" className="w-full min-[420px]:w-auto">
                <Button variant="heroOutline" size="lg" className="w-full min-[420px]:w-auto min-h-11">
                  Özellikleri Gör
                </Button>
              </a>
            </div>
          </div>

          <div
            className="order-2 flex w-full min-w-0 justify-center sm:order-none sm:justify-end opacity-0 animate-fade-in"
            style={{ animationDelay: "0.45s" }}
          >
            <div className="relative w-full max-w-[min(100%,18rem)] sm:max-w-[22rem] md:max-w-[26rem] lg:max-w-[30rem] xl:max-w-[34rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-product.png"
                alt="AlgoryQR dijital menü — mobil uygulama mockup"
                loading="eager"
                decoding="async"
                width={1400}
                height={1400}
                className="mx-auto h-auto w-full max-w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(2rem,5vw,3.5rem)] border-t border-b border-border overflow-hidden relative">
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
