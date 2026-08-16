"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const stats = [
  { value: "10M+", label: "Oluşturulan QR Kod" },
  { value: "50K+", label: "Aktif Kullanıcı" },
  { value: "99.9%", label: "Uptime Garantisi" },
  { value: "120+", label: "Ülke" },
];

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const lineWidth = useTransform(scrollYProgress, [0.2, 0.5], ["0%", "100%"]);

  return (
    <section ref={ref} className="py-[clamp(3rem,7vw,8rem)] relative overflow-hidden">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          style={{ width: lineWidth }}
          className="h-px bg-foreground/20 mb-8 sm:mb-12 md:mb-16"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="text-center space-y-1.5 sm:space-y-2 min-w-0"
            >
              <p className="text-[44px] md:text-[56px] font-extrabold heading-tight tabular">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground text-pretty px-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ width: lineWidth }}
          className="h-px bg-foreground/20 mt-8 sm:mt-12 md:mt-16 ml-auto"
        />
      </div>
    </section>
  );
};

export default StatsSection;
