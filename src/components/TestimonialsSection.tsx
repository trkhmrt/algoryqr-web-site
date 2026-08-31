"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Tx, useT } from "@/components/google-translate-provider";

const testimonials = [
  {
    quote:
      "AlgoryQR ile menümüzü dinamik hale getirdik. Akıllı Özet sayesinde ürün açıklamalarını çok daha hızlı hazırlıyoruz.",
    name: "Elif K.",
    role: "Restoran Sahibi",
  },
  {
    quote:
      "Misafirler menüdeki asistana soru sorabiliyor. Hem QR hem dijital menü tek panelden yönetiliyor; işimiz kolaylaştı.",
    name: "Mert A.",
    role: "Kafe İşletmecisi",
  },
  {
    quote:
      "Akıllı Raporlama ile hangi ürünlerin ilgi gördüğünü net görüyoruz. Kampanyaları buna göre planlıyoruz.",
    name: "Ayşe T.",
    role: "İşletme Müdürü",
  },
];

const TestimonialsSection = () => {
  const t = useT();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-[clamp(3.5rem,8vw,8rem)]">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            <Tx>Müşteri Yorumları</Tx>
          </p>
          <h2 className="heading text-[36px] md:text-[52px] font-extrabold text-balance">
            <Tx>Kullanıcılarımız ne diyor?</Tx>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className={`rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 min-w-0 ${
                i === 2 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">&ldquo;{t(item.quote)}&rdquo;</p>
              <div>
                <p className="text-[13px] font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{t(item.role)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
