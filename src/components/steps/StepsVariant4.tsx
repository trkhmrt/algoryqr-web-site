import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import step1 from "@/assets/step-1.jpg";
import step2 from "@/assets/step-2.jpg";
import step3 from "@/assets/step-3.jpg";
import step4 from "@/assets/step-4.jpg";

const steps = [
  { icon: QrCode, title: "QR Kodunuzu Oluşturun", description: "URL, metin, vCard veya Wi-Fi bilgilerinizi girin. Saniyeler içinde dinamik QR kodunuz hazır.", image: step1.src },
  { icon: Palette, title: "Markanıza Göre Özelleştirin", description: "Renk, logo, çerçeve ve köşe stilleri ile QR kodunuzu tamamen markanıza uygun hale getirin.", image: step2.src },
  { icon: BarChart3, title: "Taramaları Anlık Takip Edin", description: "Konum, cihaz, zaman ve tekil kullanıcı bazında detaylı analitik paneli ile performansı ölçün.", image: step3.src },
  { icon: Zap, title: "Toplu İşlemlerle Ölçekleyin", description: "CSV yükleme ile yüzlerce QR kodu tek seferde oluşturun. API ile entegre edin.", image: step4.src },
];

const StepsVariant4 = () => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (idx: number) => {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  };

  const prev = () => goTo(Math.max(0, active - 1));
  const next = () => goTo(Math.min(steps.length - 1, active + 1));

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Varyant 4 — Tam Ekran Slider
          </span>
        </div>
        <div className="text-center mb-12">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Nasıl Çalışır</p>
          <h2 className="text-4xl md:text-5xl font-bold">4 adımda başlayın</h2>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Full width slider */}
          <div className="relative rounded-3xl border border-border bg-card overflow-hidden min-h-[480px] md:min-h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active}
                custom={direction}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -100 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid md:grid-cols-2 h-full"
              >
                {/* Image */}
                <div className="relative h-56 md:h-full">
                  <img
                    src={steps[active].image}
                    alt={steps[active].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-card/60" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center p-8 md:p-12 space-y-6">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = steps[active].icon;
                      return (
                        <span className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </span>
                      );
                    })()}
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Adım {active + 1} / {steps.length}
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold leading-tight">{steps[active].title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{steps[active].description}</p>

                  {/* Progress bar */}
                  <div className="flex gap-2 pt-2">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === active ? "w-10 bg-foreground" : "w-4 bg-border hover:bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            <button
              onClick={prev}
              disabled={active === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors disabled:opacity-30 z-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              disabled={active === steps.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors disabled:opacity-30 z-10"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepsVariant4;
