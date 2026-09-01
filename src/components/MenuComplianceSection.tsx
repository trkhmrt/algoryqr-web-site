"use client";

import { CheckCircle2 } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { Tx, useT } from "@/components/google-translate-provider";

const COMPLIANCE_ITEMS = [
  "Kalori (kcal / kJ) bilgisi",
  "Protein, yağ ve karbonhidrat değerleri",
  "Alerjen bilgisi (gluten, süt, vb.)",
  "QR menü üzerinden erişilebilir sunum",
  "Panelden tek merkezden güncelleme",
] as const;

const MenuComplianceSection = () => {
  const t = useT();

  return (
    <section
      id="mevzuat-uyumu"
      className="scroll-mt-14 border-y border-border/60 bg-muted/10 py-[clamp(3rem,7vw,6rem)] sm:scroll-mt-16"
    >
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Mevzuat uyumu</Tx>
          </p>
          <h2 className="heading mt-4 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] text-balance">
            <Tx>Tarım ve Orman Bakanlığı</Tx>{" "}
            <span className="font-light text-muted-foreground">
              <Tx>menü mevzuatına hazır</Tx>
            </span>
          </h2>
          <p className="section-desc mx-auto mt-4 max-w-2xl text-pretty">
            <Tx>
              Tarım ve Orman Bakanlığı&apos;nın getirdiği düzenlemeye göre restoran ve kafelerde
              menülerde kalori, protein, yağ, karbonhidrat gibi besin değerleri ile alerjen bilgisi
              sunulması zorunlu. 1 Temmuz 2026&apos;da ulusal zincir işletmeler için yürürlüğe giren
              bu yükümlülük, AlgoryQR dijital menünüzde QR üzerinden karşılanabilir.
            </Tx>
          </p>
        </Reveal>

        <Reveal className="mb-10 sm:mb-12">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/menu-mevzuat-karsilastirma.png?v=4"
              alt={t("Tarım ve Orman Bakanlığı mevzuatına uygun olmayan menü ile AlgoryQR uyumlu menü karşılaştırması")}
              loading="lazy"
              decoding="async"
              width={1920}
              height={1080}
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto max-w-2xl rounded-2xl border border-border/40 bg-white/95 p-6 sm:p-8">
            <p className="text-sm font-semibold text-foreground">
              <Tx>AlgoryQR dijital menüde desteklenen alanlar</Tx>
            </p>
            <ul className="mt-4 space-y-3">
              {COMPLIANCE_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground/90">
              <Tx>
                Ulusal zincirlerden sonra diğer işletme grupları için yükümlülükler kademeli
                genişleyecektir. AlgoryQR ile menünüzü bugünden mevzuata uygun bilgi yapısına
                taşıyabilirsiniz.
              </Tx>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MenuComplianceSection;
