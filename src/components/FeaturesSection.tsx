"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  QrCode,
  UtensilsCrossed,
  Sparkles,
  Bot,
  LineChart,
  Palette,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Dinamik QR Kodları",
    description:
      "Menü, kampanya veya ödeme bağlantınızı yazdırmadan güncelleyin; tek QR ile her zaman güncel kalın.",
  },
  {
    icon: UtensilsCrossed,
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
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Özellikler</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            QR, menü ve yapay zeka bir arada
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Oluşturmadan yönetmeye, içerikten analitiğe — işletmeniz için gereken araçlar tek platformda.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group rounded-xl border border-border bg-card/50 p-6 hover:border-foreground/20 transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="h-5 w-5 text-foreground/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
