"use client";

import { CheckCircle2, Globe } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { Tx, useT } from "@/components/google-translate-provider";

const GLOBAL_MENU_ITEMS = [
  "Menü metinleri otomatik çeviri ile sunulur",
  "Misafir istediği dili seçer — sınır yok",
  "Fiyatlar TRY, EUR, USD ve diğer para birimlerinde",
  "Tek panelden tüm diller merkezi yönetilir",
  "Turist bölgeleri ve oteller için hazır deneyim",
] as const;

const GlobalMenuSection = () => {
  const t = useT();

  return (
    <section
      id="global-menu"
      className="scroll-mt-14 py-[clamp(3rem,7vw,6rem)] sm:scroll-mt-16"
    >
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <Reveal>
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-primary" aria-hidden />
                <Tx>Global deneyim</Tx>
              </p>
              <h2 className="heading mt-4 text-[clamp(1.85rem,4.5vw,2.75rem)] font-extrabold leading-[1.05] text-balance">
                <Tx>Tek menü.</Tx>{" "}
                <span className="font-light text-muted-foreground">
                  <Tx>Dünya kadar misafir</Tx>
                </span>
              </h2>
              <p className="section-desc mt-4 text-pretty">
                <Tx>
                  Anlık dil ve kur desteği ile turist bölgelerindeki restoran ve kafelerde dil
                  engelini kaldırın. Misafirler kendi dilinde menüyü okur, istediği para biriminde
                  fiyatı görür — ek uygulama veya ayrı menü baskısı gerekmez.
                </Tx>
              </p>
              <ul className="mt-6 space-y-3">
                {GLOBAL_MENU_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm lg:ml-auto lg:max-w-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/global-menu-dil-kur.png"
                alt={t(
                  "AlgoryQR anlık dil ve kur desteği — çok dilli dijital menü ve QR kod",
                )}
                loading="lazy"
                decoding="async"
                width={1024}
                height={1024}
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default GlobalMenuSection;
