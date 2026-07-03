import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap } from "lucide-react";
import step1 from "@/assets/step-1.jpg";
import step2 from "@/assets/step-2.jpg";
import step3 from "@/assets/step-3.jpg";
import step4 from "@/assets/step-4.jpg";

const steps = [
  {
    icon: QrCode,
    title: "QR Kodunuzu Oluşturun",
    description: "URL, metin, vCard veya Wi-Fi bilgilerinizi girin. Saniyeler içinde dinamik QR kodunuz hazır.",
    image: step1.src,
  },
  {
    icon: Palette,
    title: "Markanıza Göre Özelleştirin",
    description: "Renk, logo, çerçeve ve köşe stilleri ile QR kodunuzu tamamen markanıza uygun hale getirin.",
    image: step2.src,
  },
  {
    icon: BarChart3,
    title: "Taramaları Anlık Takip Edin",
    description: "Konum, cihaz, zaman ve tekil kullanıcı bazında detaylı analitik paneli ile performansı ölçün.",
    image: step3.src,
  },
  {
    icon: Zap,
    title: "Toplu İşlemlerle Ölçekleyin",
    description: "CSV yükleme ile yüzlerce QR kodu tek seferde oluşturun. API ile entegre edin.",
    image: step4.src,
  },
];

const BeamSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const idx = Math.min(Math.floor(value * steps.length), steps.length - 1);
    setActiveIndex(idx);
  });

  const beamProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={containerRef} className="relative" style={{ height: `${steps.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Nasıl Çalışır</p>
            <h2 className="text-4xl md:text-5xl font-bold">4 adımda başlayın</h2>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_48px_1.2fr] gap-0 items-center">
            {/* Left - Step Labels */}
            <div className="flex flex-col justify-center">
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = activeIndex === i;
                return (
                  <motion.div
                    key={i}
                    animate={{ opacity: isActive ? 1 : 0.25 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 justify-end py-5 pr-6"
                  >
                    <div className="text-right">
                      <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </div>
                    <span className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? "border-foreground/40 bg-foreground/10" : "border-border bg-card"}`}>
                      <StepIcon className="h-4 w-4" />
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Center - Beam */}
            <div className="hidden md:flex justify-center">
              <div className="w-px bg-border relative" style={{ height: `${steps.length * 56 + (steps.length - 1) * 8}px` }}>
                <motion.div
                  className="absolute top-0 left-0 w-full bg-foreground rounded-full"
                  style={{ height: useTransform(beamProgress, (v) => `${v}%`) }}
                />
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-foreground"
                  style={{
                    top: useTransform(beamProgress, (v) => `${v}%`),
                    boxShadow: "0 0 10px 3px hsl(0 0% 100% / 0.25)",
                  }}
                />
              </div>
            </div>

            {/* Right - Image + Description */}
            <div className="relative pl-6 min-h-[380px]">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0,
                    y: activeIndex === i ? 0 : 30,
                    scale: activeIndex === i ? 1 : 0.96,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 flex flex-col justify-center pl-6 space-y-5"
                  style={{ pointerEvents: activeIndex === i ? "auto" : "none" }}
                >
                  <div className="rounded-xl border border-border overflow-hidden glow-card">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-48 md:h-56 object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Adım {i + 1}/{steps.length}
                    </span>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeamSection;
