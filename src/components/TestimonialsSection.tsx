"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  {
    quote: "AlgoryQR ile restoran menümüzü dinamik hale getirdik. Artık fiyat değişikliklerini anında güncelliyoruz.",
    name: "Elif K.",
    role: "Restoran Sahibi",
  },
  {
    quote: "Etkinlik biletlerimiz için QR kod oluşturduk. Tarama analitikleri sayesinde katılım oranlarını anlık takip ediyoruz.",
    name: "Mert A.",
    role: "Etkinlik Yöneticisi",
  },
  {
    quote: "API entegrasyonu sayesinde e-ticaret sitemizde her sipariş için otomatik QR kod üretiyoruz.",
    name: "Ayşe T.",
    role: "E-Ticaret Müdürü",
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Müşteri Yorumları</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Kullanıcılarımız ne diyor?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
