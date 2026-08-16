"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/faq";

const FaqSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="faq" ref={ref} className="py-[clamp(3.5rem,8vw,8rem)] relative">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            SSS
          </p>
          <h2 className="sr-heading text-3xl leading-[1.05] sm:text-5xl text-balance">
            Sıkça sorulan sorular
          </h2>
          <p className="section-desc max-w-lg mx-auto text-pretty">
            QR, dijital menü ve yapay zeka özellikleriyle ilgili merak edilenler.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto w-full"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.question} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base py-3 sm:py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
