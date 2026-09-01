"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Reveal } from "@/components/site/Reveal";
import { FeatureCarousel } from "@/components/site/FeatureCarousel";
import SmartChefCompareSection from "@/components/SmartChefCompareSection";
import { Button } from "@/components/ui/button";
import { Tx, useT } from "@/components/google-translate-provider";
import {
  SMART_CHEF_FAQ,
  SMART_CHEF_GUEST_STEPS,
  SMART_CHEF_VALUE_HIGHLIGHTS,
  SMART_CHEF_WHY,
} from "@/lib/smart-chef-content";
import type { FeatureCarouselItem } from "@/components/site/FeatureCarousel";

function localizeCarouselItems(items: FeatureCarouselItem[], t: (text: string) => string) {
  return items.map((item) => ({
    ...item,
    title: t(item.title),
    text: t(item.text),
  }));
}

export default function AkilliSefView() {
  const t = useT();
  const valueHighlights = localizeCarouselItems(SMART_CHEF_VALUE_HIGHLIGHTS, t);
  const guestSteps = localizeCarouselItems(SMART_CHEF_GUEST_STEPS, t);
  const whyChef = localizeCarouselItems(SMART_CHEF_WHY, t);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <main className="w-full pt-[max(5.5rem,12vw)]">
        <section className="pb-[clamp(2.5rem,6vw,4rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Link
                href="/#why-us"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <Tx>Anasayfa</Tx>
              </Link>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                <Tx>Yapay zeka asistanı</Tx>
              </p>
              <h1 className="heading mt-4 text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] text-balance">
                <Tx>Akıllı Şef</Tx>
              </h1>
              <p className="section-desc mx-auto mt-6 max-w-2xl text-pretty">
                <Tx>
                  Dijital menünüzde gömülü yapay zeka asistanı. Misafirleriniz hangi dilde olursa olsun
                  soru sorar, menünüzden kişiselleştirilmiş ürün önerileri alır ve görsel kartlarla
                  doğrudan siparişe yönlendirilir.
                </Tx>
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 min-[420px]:flex-row min-[420px]:items-center">
                <Link href="/register" className="w-full min-[420px]:w-auto">
                  <Button variant="hero" size="lg" className="w-full min-h-11 gap-2 min-[420px]:w-auto">
                    <Tx>Ücretsiz dene</Tx>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <SmartChefCompareSection />

        <section className="relative border-y border-border bg-white py-[clamp(2rem,5vw,3.5rem)]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[380px] bg-[radial-gradient(ellipse_at_50%_100%,hsl(var(--primary)/0.12),transparent_68%)]"
            aria-hidden
          />
          <div className="container relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-8 max-w-2xl sm:mb-10">
              <h2 className="heading text-2xl font-extrabold sm:text-3xl">
                <Tx>Akıllı Şef neler sunar?</Tx>
              </h2>
            </Reveal>

            <div className="flex flex-col gap-8 sm:gap-10">
              <Reveal className="relative mx-auto w-full max-w-[min(100%,16rem)] sm:max-w-[20rem] md:max-w-[22rem]">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_70%)] blur-2xl"
                  aria-hidden
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/akilli-sef-hero.png"
                  alt={t("Akıllı Şef — dijital menü asistanı")}
                  loading="eager"
                  decoding="async"
                  width={1024}
                  height={1024}
                  className="relative mx-auto h-auto w-full max-w-full"
                />
              </Reveal>

              <FeatureCarousel
                items={valueHighlights}
                orientation="responsive"
                className="sm:mx-auto sm:h-[min(28rem,55vh)] sm:w-full sm:max-w-xl"
              />
            </div>
          </div>
        </section>

        <section id="nasil-calisir" className="py-[clamp(3.5rem,8vw,6rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl sm:mb-14">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                <Tx>Süreç</Tx>
              </p>
              <h2 className="heading mt-4 text-[36px] font-extrabold md:text-[48px]">
                <Tx>Misafir deneyimi</Tx>{" "}
                <span className="font-light text-muted-foreground">
                  <Tx>dört adımda</Tx>
                </span>
              </h2>
              <p className="section-desc mt-4">
                <Tx>
                  QR okutmadan siparişe kadar akıcı bir yolculuk; misafir karar verirken sizin menünüz
                  konuşur.
                </Tx>
              </p>
            </Reveal>

            <FeatureCarousel items={guestSteps} />
          </div>
        </section>

        <section className="border-t border-border bg-muted/15 py-[clamp(3.5rem,8vw,6rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl sm:mb-14">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                <Tx>İşletmeniz için</Tx>
              </p>
              <h2 className="heading mt-4 text-[36px] font-extrabold md:text-[48px]">
                <Tx>Neden Akıllı Şef?</Tx>
              </h2>
            </Reveal>

            <FeatureCarousel items={whyChef} />
          </div>
        </section>

        <section className="border-t border-border py-[clamp(3rem,7vw,5rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
              <Reveal>
                <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Tx>SSS</Tx>
                </p>
                <h2 className="heading mt-4 text-3xl font-extrabold sm:text-4xl">
                  <Tx>Sık sorulan sorular</Tx>
                </h2>
                <p className="section-desc mt-4">
                  <Tx>Akıllı Şef hakkında merak edilenler. Daha fazlası için</Tx>{" "}
                  <Link href="/#faq" className="text-foreground underline-offset-4 hover:underline">
                    <Tx>genel SSS</Tx>
                  </Link>{" "}
                  <Tx>bölümüne bakabilirsiniz.</Tx>
                </p>
              </Reveal>

              <div className="space-y-4">
                {SMART_CHEF_FAQ.map((item, i) => (
                  <Reveal key={item.q} delay={i * 70} as="article">
                    <div className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
                      <h3 className="font-extrabold">{t(item.q)}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(item.a)}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-[clamp(3rem,7vw,6rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12 md:p-16">
                <h2 className="heading text-3xl font-extrabold sm:text-4xl md:text-5xl text-balance">
                  <Tx>Menünüze Akıllı Şef ekleyin</Tx>
                </h2>
                <p className="section-desc mx-auto mt-4 max-w-lg text-pretty">
                  <Tx>
                    Dijital menünüzü dakikalar içinde yayına alın; misafirleriniz yapay zeka destekli
                    önerilerle tanışsın.
                  </Tx>
                </p>
                <Link href="/register" className="mt-8 inline-flex w-full sm:w-auto">
                  <Button variant="hero" size="lg" className="w-full min-h-11 gap-2 sm:w-auto">
                    <Tx>Ücretsiz başla</Tx>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
