"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { Tx, useT } from "@/components/google-translate-provider";

const SUMMARY_ITEMS = [
  "Ürün adından yapay zeka destekli açıklama üretin",
  "Boş açıklama alanını saniyeler içinde doldurun",
  "Metin doğrudan menünüze yazılır — kopyala-yapıştır gerekmez",
  "Onlarca ürünü kısa sürede panele ekleyin",
] as const;

const SmartSummarySection = () => {
  const t = useT();

  return (
    <section
      id="akilli-ozet"
      className="scroll-mt-14 border-y border-border/60 bg-muted/10 py-[clamp(3rem,7vw,6rem)] sm:scroll-mt-16"
    >
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/akilli-ozet-urun-ekleme.png"
                alt={t(
                  "Akıllı Özet — ürün adından yapay zeka ile otomatik menü açıklaması oluşturma",
                )}
                loading="lazy"
                decoding="async"
                width={1024}
                height={576}
                className="h-auto w-full"
              />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                <Tx>Akıllı Özet</Tx>
              </p>
              <h2 className="heading mt-4 text-[clamp(1.85rem,4.5vw,2.75rem)] font-extrabold leading-[1.05] text-balance">
                <Tx>Yapay zekayla</Tx>{" "}
                <span className="font-light text-muted-foreground">
                  <Tx>çok kısa sürede ürün ekleyin</Tx>
                </span>
              </h2>
              <p className="section-desc mt-4 text-pretty">
                <Tx>
                  Ürün adını yazın, Akıllı Özet açıklamayı sizin için oluştursun. Menü metinlerini
                  sıfırdan yazmak yerine dakikalar içinde onlarca ürünü panele ekleyip yayına alın.
                </Tx>
              </p>
              <ul className="mt-6 space-y-3">
                {SUMMARY_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default SmartSummarySection;
