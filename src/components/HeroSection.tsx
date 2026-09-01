"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Tx } from "@/components/google-translate-provider";

const HeroSection = () => {
  return (
    <section className="relative flex flex-col pt-[max(5.5rem,12vw)] pb-[clamp(2.5rem,6vw,4rem)]">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] sm:gap-8 md:gap-10 lg:gap-14 xl:gap-16">
          <div className="order-1 mx-auto w-full max-w-xl space-y-5 text-center sm:order-none sm:mx-0 sm:max-w-none sm:space-y-6 sm:text-left md:space-y-7 lg:space-y-8">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground opacity-0 animate-fade-in">
              <Tx>Dijital menü · QR · Yapay zeka</Tx>
            </p>

            <h1
              className="text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.92] font-extrabold opacity-0 animate-fade-in break-words text-balance sm:mt-2"
              style={{ animationDelay: "0.1s" }}
            >
              <Tx>Restoranınızın dijital menüsünü dakikalar içinde yayınlayın.</Tx>
            </h1>

            <p
              className="mx-auto max-w-lg text-base text-muted-foreground leading-relaxed opacity-0 animate-fade-in text-pretty sm:mx-0 sm:text-lg"
              style={{ animationDelay: "0.2s" }}
            >
              <Tx>
                QR ile güncel menü, Akıllı Şef asistanı ve raporlama — baskı maliyeti olmadan, tek
                panelden yönetin.
              </Tx>
            </p>

            <div
              className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center justify-center gap-3 sm:justify-start sm:gap-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/register" className="w-full min-[420px]:w-auto">
                <Button variant="hero" size="lg" className="w-full min-[420px]:w-auto gap-2 min-h-11">
                  <Tx>Ücretsiz Başla</Tx> <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#nasil-calisir" className="w-full min-[420px]:w-auto">
                <Button variant="heroOutline" size="lg" className="w-full min-[420px]:w-auto min-h-11">
                  <Tx>Nasıl çalışır?</Tx>
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
    </section>
  );
};

export default HeroSection;
