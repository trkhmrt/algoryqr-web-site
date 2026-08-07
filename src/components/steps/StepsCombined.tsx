"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Palette, Sparkles, LineChart, ChevronDown } from "lucide-react";
import step1 from "@/assets/step-1.jpg";
import step2 from "@/assets/step-2.jpg";
import step3 from "@/assets/step-3.jpg";
import step4 from "@/assets/step-4.jpg";

const steps = [
  {
    icon: QrCode,
    title: "QR ve menünüzü oluşturun",
    description:
      "Dinamik QR kodunuzu oluşturun, dijital menünüzü şablonlarla yayınlayın. Saniyeler içinde misafirlerinize ulaşın.",
    image: step1.src,
  },
  {
    icon: Palette,
    title: "Markanıza göre özelleştirin",
    description:
      "Renk, logo ve menü şablonlarıyla görünümü işletmenizin kimliğine uyarlayın; yazdırmadan güncelleyin.",
    image: step2.src,
  },
  {
    icon: Sparkles,
    title: "Yapay zeka ile hızlanın",
    description:
      "Akıllı Özet ile ürün açıklamaları yazın, Akıllı Asistan ile menüdeki misafir sorularına yanıt verin.",
    image: step3.src,
  },
  {
    icon: LineChart,
    title: "Akıllı raporlarla takip edin",
    description:
      "Ziyaret ve ürün ilgisine dayalı Akıllı Raporlama ile performansı ölçün; paketiniz büyüdükçe ölçekleyin.",
    image: step4.src,
  },
];

const StepsCombined = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="py-[clamp(3rem,7vw,6rem)] relative overflow-hidden">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3">
          <p className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-widest">Nasıl Çalışır</p>
          <h2
            className="font-bold text-balance"
            style={{ fontSize: "clamp(1.75rem, 1.2rem + 2.2vw, 3rem)", lineHeight: 1.15 }}
          >
            4 adımda akıllı QR deneyimi
          </h2>
        </div>

        <div className="hidden md:block max-w-4xl mx-auto relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-px" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex items-start gap-6 mb-16 last:mb-0 ${
                  isEven ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <div className="h-12 w-12 rounded-full border-2 border-foreground/20 bg-card flex items-center justify-center shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                </div>

                <div className={`w-[calc(50%-40px)] ${isEven ? "pr-8" : "pl-8"} ${isEven ? "" : "ml-auto"}`}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="rounded-xl overflow-hidden mb-4 bg-muted">
                      <img src={step.image} alt={step.title} className="w-full h-44 object-contain" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Adım {i + 1}
                    </span>
                    <h3 className="text-xl font-bold mt-1 mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="md:hidden space-y-2.5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = active === i;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(isActive ? -1 : i)}
                className={`w-full text-left rounded-xl border p-3.5 sm:p-4 transition-colors duration-200 ${
                  isActive
                    ? "border-foreground/20 bg-foreground/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug">{step.title}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div className="pt-3.5 space-y-3">
                    <div className="rounded-xl overflow-hidden bg-muted aspect-[4/3] sm:aspect-auto">
                      <img src={step.image} alt={step.title} className="w-full h-full sm:h-48 object-contain" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StepsCombined;
