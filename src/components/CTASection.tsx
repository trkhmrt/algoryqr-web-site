"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-card p-12 md:p-20 text-center space-y-6 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            İlk QR kodunuzu oluşturmaya hazır mısınız?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ücretsiz başlayın. Kredi kartı gerektirmez. Dakikalar içinde ilk dinamik QR kodunuz hazır.
          </p>
          <Link href="/login">
            <Button variant="hero" size="lg" className="gap-2 mt-4">
              Ücretsiz Başla <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
