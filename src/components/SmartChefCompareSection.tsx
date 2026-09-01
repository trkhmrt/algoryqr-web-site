"use client";

import { Reveal } from "@/components/site/Reveal";
import { Tx, useT } from "@/components/google-translate-provider";

const SmartChefCompareSection = () => {
  const t = useT();

  return (
    <section className="py-[clamp(3rem,7vw,6rem)]">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Karşılaştırma</Tx>
          </p>
          <h2 className="heading mt-4 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] text-balance">
            <Tx>Klasik QR menü</Tx>{" "}
            <span className="font-light text-muted-foreground">
              <Tx>vs Akıllı Şef</Tx>
            </span>
          </h2>
          <p className="section-desc mx-auto mt-4 max-w-2xl text-pretty">
            <Tx>
              Aynı restoran, aynı menü — fark yalnızca rehberlik. Misafir deneyimini yan yana görün.
            </Tx>
          </p>
        </Reveal>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/akilli-sef-menu-karsilastirma.png"
              alt={t("Klasik QR menü ve Akıllı Şef menü karşılaştırması")}
              loading="lazy"
              decoding="async"
              width={1920}
              height={1080}
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default SmartChefCompareSection;
