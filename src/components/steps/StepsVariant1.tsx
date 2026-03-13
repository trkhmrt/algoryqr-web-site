import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap, ChevronLeft, ChevronRight } from "lucide-react";
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

const StepsVariant1 = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Varyant 1 — Horizontal Stepper
          </span>
        </div>
        <div className="text-center mb-12">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Nasıl Çalışır</p>
          <h2 className="text-4xl md:text-5xl font-bold">4 adımda başlayın</h2>
        </div>

        {/* Stepper dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 text-sm font-medium ${
                  active === i
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title.split(" ").slice(0, 2).join(" ")}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto relative min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="rounded-2xl border border-border overflow-hidden">
                <img src={steps[active].image} alt={steps[active].title} className="w-full h-64 md:h-80 object-cover" />
              </div>
              <div className="space-y-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Adım {active + 1}/{steps.length}
                </span>
                <h3 className="text-3xl font-bold">{steps[active].title}</h3>
                <p className="text-muted-foreground leading-relaxed">{steps[active].description}</p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setActive(Math.max(0, active - 1))}
                    disabled={active === 0}
                    className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActive(Math.min(steps.length - 1, active + 1))}
                    disabled={active === steps.length - 1}
                    className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default StepsVariant1;
