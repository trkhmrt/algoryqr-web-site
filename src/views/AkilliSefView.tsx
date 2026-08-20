"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Reveal } from "@/components/site/Reveal";
import { FeatureCarousel, type FeatureCarouselItem } from "@/components/site/FeatureCarousel";
import { Button } from "@/components/ui/button";

const VALUE_HIGHLIGHTS = [
  {
    title: "7/24 menüde aktif",
    text: "Dijital menünüz yayında olduğu sürece Akıllı Şef misafirlerinize eşlik eder; ek kurulum gerekmez.",
  },
  {
    title: "Her dilde sohbet",
    text: "Misafir hangi dilde yazarsa Akıllı Şef aynı dilde yanıt verir. Dil listesi veya sınırlama yoktur.",
  },
  {
    title: "Doğal dilde soru-cevap",
    text: "Sohbet akışında soru sorar; menünüzden tercih, alerjen ve bütçeye göre kişiselleştirilmiş öneriler alır.",
  },
  {
    title: "Görsel ürün kartları",
    text: "Önerilen ürünler fotoğraf, isim ve fiyatla kart olarak listelenir; tek dokunuşla siparişe gider.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Menüyü açar",
    text: "Misafir QR kodu okutur; dijital menünüz saniyeler içinde telefonunda açılır.",
  },
  {
    step: "02",
    title: "Soru sorar",
    text: "Misafir hangi dilde yazarsa yazsın soru sorar; Akıllı Şef aynı dilde yanıt verir — ek dil ayarı gerekmez.",
  },
  {
    step: "03",
    title: "Öneri alır",
    text: "Akıllı Şef menünüzü analiz eder; tercih, alerjen ve fiyat bilgisine göre yanıt üretir.",
  },
  {
    step: "04",
    title: "Siparişe gider",
    text: "Önerilen ürünler görsel kartlarla listelenir; misafir tek dokunuşla sepete ekler.",
  },
];

const WHY_CHEF: FeatureCarouselItem[] = [
  {
    title: "Sepet dönüşümü",
    text: "Metin yanıtının yanında görsel kartlar sunarak siparişe geçişi kolaylaştırır; misafir tek dokunuşla sepete ekler.",
  },
  {
    title: "Artan satışlar",
    text: "Kişiselleştirilmiş önerilerle ortalama sepet tutarı ve ek satış fırsatları artar; kararsız misafir hızla doğru ürüne ulaşır.",
  },
  {
    title: "Kurulum gerektirmez",
    text: "Dijital menünüz yayında olduğu sürece Akıllı Şef misafirlerinizle birlikte hazır; ek uygulama veya entegrasyon gerekmez.",
  },
  {
    title: "Her işletme tipine uyum sağlar",
    text: "Restoran, kafe, pastane ve bistro… Menü yapınıza göre öneri sunar; her işletme modelinde aynı akıcı deneyim.",
  },
];

const FAQ = [
  {
    q: "Akıllı Şef menü dışında bir uygulama mı?",
    a: "Hayır. Dijital menünüze gömülü çalışır; misafirler ek uygulama indirmeden sohbet eder.",
  },
  {
    q: "Hangi sorulara yanıt verebilir?",
    a: "Menünüzde tanımlı ürünler, kategoriler, fiyatlar ve açıklamalar üzerinden öneri ve bilgi sunar.",
  },
  {
    q: "Sadece belirli dillerde mi çalışır?",
    a: "Hayır. Misafir hangi dilde soru sorarsa Akıllı Şef o dilde yanıt verir. Dil listesi, sınırlama veya ek kurulum gerekmez.",
  },
  {
    q: "Garsonların yerini mi alır?",
    a: "Hayır. Karar vermekte zorlanan misafirlere rehberlik eder; servis ekibinizi destekler.",
  },
];

export default function AkilliSefView() {
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
                Neden biz
              </Link>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Yapay zeka asistanı</p>
              <h1 className="heading mt-4 text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[0.95] text-balance">
                Akıllı Şef
              </h1>
              <p className="section-desc mx-auto mt-6 max-w-2xl text-pretty">
                Dijital menünüzde gömülü yapay zeka asistanı. Misafirleriniz hangi dilde olursa olsun soru sorar, menünüzden
                kişiselleştirilmiş ürün önerileri alır ve görsel kartlarla doğrudan siparişe yönlendirilir.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 min-[420px]:flex-row min-[420px]:items-center">
                <Link href="/register" className="w-full min-[420px]:w-auto">
                  <Button variant="hero" size="lg" className="w-full min-h-11 gap-2 min-[420px]:w-auto">
                    Ücretsiz dene
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative border-y border-border bg-white py-[clamp(2rem,5vw,3.5rem)]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[380px] bg-[radial-gradient(ellipse_at_50%_100%,hsl(var(--chart-violet)/0.14),hsl(var(--chart-indigo)/0.08)_42%,transparent_68%)]"
            aria-hidden
          />
          <div className="container relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-8 max-w-2xl sm:mb-10">
              <h2 className="heading text-2xl font-extrabold sm:text-3xl">
                Akıllı Şef neler sunar?
              </h2>
            </Reveal>

            <div className="flex flex-col gap-8 sm:gap-10">
              <Reveal className="relative mx-auto w-full max-w-[min(100%,16rem)] sm:max-w-[20rem] md:max-w-[22rem]">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--chart-violet)/0.22),hsl(var(--chart-indigo)/0.1)_45%,transparent_70%)] blur-2xl"
                  aria-hidden
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/akilli-sef-hero.png"
                  alt="Akıllı Şef — dijital menü asistanı"
                  loading="eager"
                  decoding="async"
                  width={1024}
                  height={1024}
                  className="relative mx-auto h-auto w-full max-w-full"
                />
              </Reveal>

              <FeatureCarousel
                items={VALUE_HIGHLIGHTS}
                orientation="responsive"
                className="sm:mx-auto sm:h-[min(28rem,55vh)] sm:w-full sm:max-w-xl"
              />
            </div>
          </div>
        </section>

        <section id="nasil-calisir" className="py-[clamp(3.5rem,8vw,6rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl sm:mb-14">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Süreç</p>
              <h2 className="heading mt-4 text-[36px] font-extrabold md:text-[48px]">
                Misafir deneyimi{" "}
                <span className="font-light text-muted-foreground">dört adımda</span>
              </h2>
              <p className="section-desc mt-4">
                QR okutmadan siparişe kadar akıcı bir yolculuk; misafir karar verirken sizin menünüz konuşur.
              </p>
            </Reveal>

            <FeatureCarousel items={STEPS} />
          </div>
        </section>

        <section className="border-t border-border bg-muted/15 py-[clamp(3.5rem,8vw,6rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl sm:mb-14">
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">İşletmeniz için</p>
              <h2 className="heading mt-4 text-[36px] font-extrabold md:text-[48px]">
                Neden Akıllı Şef?
              </h2>
            </Reveal>

            <FeatureCarousel items={WHY_CHEF} />
          </div>
        </section>

        <section className="border-t border-border py-[clamp(3rem,7vw,5rem)]">
          <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
              <Reveal>
                <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">SSS</p>
                <h2 className="heading mt-4 text-3xl font-extrabold sm:text-4xl">Sık sorulan sorular</h2>
                <p className="section-desc mt-4">
                  Akıllı Şef hakkında merak edilenler. Daha fazlası için{" "}
                  <Link href="/#faq" className="text-foreground underline-offset-4 hover:underline">
                    genel SSS
                  </Link>
                  bölümüne bakabilirsiniz.
                </p>
              </Reveal>

              <div className="space-y-4">
                {FAQ.map((item, i) => (
                  <Reveal key={item.q} delay={i * 70} as="article">
                    <div className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
                      <h3 className="font-extrabold">{item.q}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
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
                  Menünüze Akıllı Şef ekleyin
                </h2>
                <p className="section-desc mx-auto mt-4 max-w-lg text-pretty">
                  Dijital menünüzü dakikalar içinde yayına alın; misafirleriniz yapay zeka destekli önerilerle tanışsın.
                </p>
                <Link href="/register" className="mt-8 inline-flex w-full sm:w-auto">
                  <Button variant="hero" size="lg" className="w-full min-h-11 gap-2 sm:w-auto">
                    Ücretsiz başla
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
