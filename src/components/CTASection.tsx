"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-[clamp(3rem,7vw,8rem)]">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-10 md:p-16 lg:p-20 text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto"
        >
          <h2
            className="font-bold text-balance"
            style={{ fontSize: "clamp(1.75rem, 1.2rem + 2.2vw, 3rem)", lineHeight: 1.15 }}
          >
            QR menünüzü ve yapay zeka araçlarını keşfedin
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto text-pretty">
            Ücretsiz başlayın. Dinamik QR, dijital menü, Akıllı Özet, Asistan ve Raporlama — dakikalar içinde hazır.
          </p>
          <Link href="/register" className="inline-flex w-full sm:w-auto justify-center">
            <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2 mt-2 min-h-11">
              Ücretsiz Başla <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
