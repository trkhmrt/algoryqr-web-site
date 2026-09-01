"use client";

import { QrCode, Sparkles } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";
import { Tx, useT } from "@/components/google-translate-provider";

type FeatureItem = {
  id: string;
  title: string;
  eyebrow: string;
  text: string;
  aiIcon?: boolean;
  qrIcon?: boolean;
  bentoClass: string;
};

const FEATURES: FeatureItem[] = [
  {
    id: "digital-menu",
    title: "Dijital Menü & QR",
    eyebrow: "Temel ürün",
    text: "Hazır şablonlarla menünüzü yayınlayın. Tek QR ile fiyat ve ürün güncellemelerini anında yansıtın; yeniden baskı gerekmez.",
    qrIcon: true,
    bentoClass: "md:col-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    id: "akilli-sef",
    title: "Akıllı Şef",
    eyebrow: "Yapay zeka asistanı",
    text: "Misafirler menüde soru sorar, her dilde yanıt alır ve görsel kartlarla siparişe yönlendirilir. Dijital menünüze gömülü çalışır; ek kurulum gerekmez.",
    aiIcon: true,
    bentoClass: "md:col-span-2 lg:col-span-2",
  },
  {
    id: "akilli-ozet",
    title: "Akıllı Özet",
    eyebrow: "Yapay zeka asistanı",
    text: "Ürün adı, kategori ve etiketlerinize göre yapay zeka destekli açıklama üretin; metin doğrudan menünüze yazılır.",
    aiIcon: true,
    bentoClass: "lg:col-span-1",
  },
  {
    id: "akilli-raporlama",
    title: "Akıllı Raporlama",
    eyebrow: "Yapay zeka analizi",
    text: "Ziyaret, ürün ilgisi ve müşteri puanlarını yapay zeka yorumlar; funnel, yoğun saatler ve aksiyon önerileriyle PDF rapor sunar.",
    aiIcon: true,
    bentoClass: "lg:col-span-1",
  },
];

function FeatureCard({ item, t }: { item: FeatureItem; t: (text: string) => string }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/40 bg-white/95 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-border/70 dark:bg-card/95 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {t(item.eyebrow)}
      </p>
      <h3 className="mt-3 flex items-center gap-2 text-[clamp(1.35rem,2.5vw,1.75rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {item.qrIcon ? (
          <QrCode className="h-[0.9em] w-[0.9em] shrink-0 text-primary" aria-hidden />
        ) : null}
        {item.aiIcon ? (
          <Sparkles className="h-[0.9em] w-[0.9em] shrink-0 text-primary" aria-hidden />
        ) : null}
        {t(item.title)}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {t(item.text)}
      </p>
    </div>
  );
}

const WhyUsSection = () => {
  const t = useT();

  return (
    <section id="why-us" className="relative scroll-mt-14 py-[clamp(3.5rem,8vw,8rem)] sm:scroll-mt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.08),transparent_65%)]"
        aria-hidden
      />

      <div className="container relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 max-w-3xl sm:mb-12">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Platform özellikleri</Tx>
          </p>
          <h2 className="heading mt-5 text-[clamp(2.25rem,5.5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-balance">
            <Tx>Menüden rapora</Tx>{" "}
            <span className="font-light text-muted-foreground">
              <Tx>tek çözüm</Tx>
            </span>
          </h2>
          <p className="section-desc-lg mt-5 max-w-2xl text-pretty">
            <Tx>
              Dijital menü, yapay zeka asistanı, içerik üretimi ve raporlama — hepsi tek panelde.
            </Tx>
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {FEATURES.map((item, i) => (
            <Reveal key={item.id} delay={(i + 1) * 60} as="article" className={cn("min-w-0", item.bentoClass)}>
              <FeatureCard item={item} t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
