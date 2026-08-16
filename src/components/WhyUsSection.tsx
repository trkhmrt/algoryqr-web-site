"use client";

import { Sparkles } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { DetailExploreLink } from "@/components/site/DetailExploreLink";
import { VioletBeamCard } from "@/components/site/VioletBeamCard";

const SMART_CHEF = {
  eyebrow: "Yapay zeka asistanı",
  title: "Akıllı Şef",
  text: "Misafirleriniz menüde soru sorsun; yapay zeka tercihlerine göre ürün önersin. Sıcak içecekten tatlıya, sohbet akışında görsel kartlarla doğrudan siparişe yönlendirin.",
  screenshot: "/images/akilli-sef-screenshot.png",
  screenshotAlt: "Akıllı Şef menü asistanı — misafir sohbeti ve ürün öneri kartları",
};

const HIGHLIGHTS = [
  {
    id: "akilli-ozet",
    title: "Akıllı Özet",
    eyebrow: "Yapay zeka asistanı",
    text: "Ürün adı, kategori ve etiketlerinize göre yapay zeka destekli açıklama üretin; metin doğrudan menünüze yazılır.",
    img: "/images/akilli-ozet-card.png",
    alt: "Akıllı Özet — yapay zeka ile üretilen ürün açıklaması",
    imageVariant: "screenshot" as const,
    aiIcon: true,
  },
  {
    id: "akilli-raporlama",
    title: "Akıllı Raporlama",
    eyebrow: "Yapay zeka analizi",
    text: "Menü ziyaretlerinizi, ürün ilgisini ve müşteri puanlarını yapay zeka yorumlar; funnel, yoğun saatler ve aksiyon önerileriyle PDF rapor sunar.",
    img: "/images/akilli-raporlama-card.png",
    alt: "Akıllı Raporlama — yapay zeka ile üretilen menü analiz raporu",
    imageVariant: "screenshot" as const,
    aiIcon: true,
  },
];

const WhyUsSection = () => {
  return (
    <section id="why-us" className="relative py-[clamp(3.5rem,8vw,8rem)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--chart-indigo)/0.1),transparent_65%)]"
        aria-hidden
      />

      <div className="container relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 max-w-4xl sm:mb-16">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            Neden biz
          </p>
          <h2 className="heading mt-5 text-[clamp(2.75rem,6.5vw,4.75rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-balance">
            Yeni nesil{" "}
            <span className="font-light text-muted-foreground">QR menü deneyimi</span>
          </h2>
          <p className="section-desc-lg mt-6 max-w-3xl text-pretty">
            AlgoryQR, işletmenizin hızla yayına çıkmasını, güvenle büyümesini ve veriye dayalı karar
            almasını sağlar.
          </p>
        </Reveal>

        <Reveal className="mb-4" as="article">
          <VioletBeamCard>
            <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-12">
            <div className="flex items-center justify-center lg:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SMART_CHEF.screenshot}
                alt={SMART_CHEF.screenshotAlt}
                loading="lazy"
                decoding="async"
                width={430}
                height={932}
                className="h-auto w-full max-w-[min(100%,280px)] rounded-[1.75rem] object-cover shadow-[0_24px_56px_-16px_rgba(0,0,0,0.28)] ring-1 ring-border/70 sm:max-w-[300px] lg:max-w-[320px]"
              />
            </div>

            <div className="flex flex-col justify-center lg:py-4">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                {SMART_CHEF.eyebrow}
              </p>
              <h3 className="heading mt-5 text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1] tracking-[-0.04em]">
                {SMART_CHEF.title}
              </h3>
              <p className="section-desc-lg mt-6 max-w-lg text-pretty">
                {SMART_CHEF.text}
              </p>
              <DetailExploreLink href="/akilli-sef" className="mt-10">
                Detaylı incele
              </DetailExploreLink>
            </div>
            </div>
          </VioletBeamCard>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item, i) => (
            <Reveal key={item.id} delay={(i + 1) * 110} as="article" className="min-w-0">
              <div className="group flex h-full flex-col rounded-3xl border border-border bg-card/50 p-8 transition-colors hover:border-foreground/15 sm:p-10">
                {"eyebrow" in item && item.eyebrow ? (
                  <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                    {item.eyebrow}
                  </p>
                ) : null}
                <h3
                  className={`flex items-center gap-2.5 text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-[1.08] tracking-[-0.03em] ${
                    "eyebrow" in item && item.eyebrow ? "mt-3" : ""
                  }`}
                >
                  {"aiIcon" in item && item.aiIcon ? (
                    <Sparkles
                      className="h-[0.95em] w-[0.95em] shrink-0 text-[hsl(var(--chart-indigo))]"
                      aria-hidden
                    />
                  ) : null}
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {item.text}
                </p>
                <div className="mt-10 grid flex-1 place-items-center">
                  {item.imageVariant === "screenshot" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.img}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      width={472}
                      height={369}
                      className="h-auto w-full max-w-[min(100%,380px)] rounded-2xl shadow-[0_20px_48px_-14px_rgba(0,0,0,0.22)] ring-1 ring-border/70 transition-transform duration-700 ease-out group-hover:-translate-y-1"
                    />
                  ) : item.imageVariant === "wide-illustration" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.img}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      width={1024}
                      height={1024}
                      className="h-auto w-full max-w-[min(100%,440px)] transition-transform duration-700 ease-out group-hover:-translate-y-1.5"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.img}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      width={1024}
                      height={1024}
                      className="w-56 max-w-full transition-transform duration-700 ease-out group-hover:-translate-y-1.5 sm:w-64"
                    />
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
