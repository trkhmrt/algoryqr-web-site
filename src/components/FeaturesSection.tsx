"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  QrCode,
  Sparkles,
  Bot,
  LineChart,
  Palette,
} from "lucide-react";

import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";

const features = [
  {
    icon: QrCode,
    title: "Dinamik QR Kodları",
    description:
      "Menü, kampanya veya ödeme bağlantınızı yazdırmadan güncelleyin; tek QR ile her zaman güncel kalın.",
  },
  {
    icon: DigitalMenuIcon,
    title: "Dijital Menü",
    description:
      "Hazır şablonlarla markanıza uygun menü yayınlayın. Fiyat ve ürün değişikliklerini anında yansıtın.",
  },
  {
    icon: Sparkles,
    title: "Akıllı Özet",
    description:
      "Ürün adından yapay zeka ile açıklama üretin. Menü metinlerini dakikalar değil saniyeler içinde hazırlayın.",
  },
  {
    icon: Bot,
    title: "Akıllı Asistan",
    description:
      "Misafirleriniz menü üzerinden soru sorabilsin. Öneri ve yönlendirme ile sipariş deneyimini kolaylaştırın.",
  },
  {
    icon: LineChart,
    title: "Akıllı Raporlama",
    description:
      "Ziyaret, ürün ilgisi ve kullanım eğilimlerini anlaşılır raporlara dönüştürün; kararları veriye dayandırın.",
  },
  {
    icon: Palette,
    title: "Markaya Uygun Tasarım",
    description:
      "Renk, logo ve şablonlarla QR ve menü görünümünü işletmenizin kimliğine göre özelleştirin.",
  },
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="features" ref={ref} className="py-[clamp(3.5rem,8vw,8rem)] relative">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Özellikler</p>
          <h2 className="sr-heading text-3xl leading-[1.05] sm:text-5xl text-balance">
            QR, menü ve yapay zeka bir arada
          </h2>
          <p className="section-desc max-w-lg mx-auto text-pretty">
            Oluşturmadan yönetmeye, içerikten analitiğe — işletmeniz için gereken araçlar tek platformda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group rounded-xl border border-border bg-card/50 p-4 sm:p-5 md:p-6 hover:border-foreground/20 transition-all duration-300 min-w-0"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/70" />
              </div>
              <h3 className="text-xl font-bold mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
