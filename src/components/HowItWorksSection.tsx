"use client";

import { Reveal } from "@/components/site/Reveal";
import { FeatureCarousel } from "@/components/site/FeatureCarousel";
import { Tx, useT } from "@/components/google-translate-provider";
import { BUSINESS_SETUP_STEPS } from "@/lib/smart-chef-content";

function localizeCarouselItems(
  items: typeof BUSINESS_SETUP_STEPS,
  t: (text: string) => string,
) {
  return items.map((item) => ({
    ...item,
    title: t(item.title),
    text: t(item.text),
  }));
}

const HowItWorksSection = () => {
  const t = useT();
  const steps = localizeCarouselItems(BUSINESS_SETUP_STEPS, t);

  return (
    <section
      id="nasil-calisir"
      className="scroll-mt-14 border-y border-border bg-muted/15 py-[clamp(3rem,7vw,6rem)] sm:scroll-mt-16"
    >
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 max-w-2xl sm:mb-14">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Nasıl çalışır</Tx>
          </p>
          <h2 className="heading mt-4 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.02] text-balance">
            <Tx>Dakikalar içinde</Tx>{" "}
            <span className="font-light text-muted-foreground">
              <Tx>yayına alın</Tx>
            </span>
          </h2>
          <p className="section-desc mt-4 max-w-xl text-pretty">
            <Tx>Menü oluşturma, QR yayını ve yapay zeka araçları üç adımda hazır.</Tx>
          </p>
        </Reveal>

        <FeatureCarousel items={steps} />
      </div>
    </section>
  );
};

export default HowItWorksSection;
