import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap, ChevronDown } from "lucide-react";
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

const StepsVariant3 = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Varyant 3 — Tab / Accordion
          </span>
        </div>
        <div className="text-center mb-12">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Nasıl Çalışır</p>
          <h2 className="text-4xl md:text-5xl font-bold">4 adımda başlayın</h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-[320px_1fr] gap-8">
          {/* Left - Accordion/Tabs */}
          <div className="space-y-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = active === i;

              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                    isActive
                      ? "border-foreground/20 bg-foreground/5 shadow-sm"
                      : "border-border bg-card hover:border-foreground/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{step.title}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 md:hidden ${isActive ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Mobile accordion content */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden md:hidden"
                      >
                        <div className="pt-4 space-y-3">
                          <div className="rounded-xl overflow-hidden">
                            <img src={step.image} alt={step.title} className="w-full h-48 object-cover" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Right - Desktop content */}
          <div className="hidden md:block relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-border overflow-hidden">
                  <img src={steps[active].image} alt={steps[active].title} className="w-full h-64 object-cover" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Adım {active + 1}/{steps.length}
                  </span>
                  <h3 className="text-2xl font-bold">{steps[active].title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{steps[active].description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepsVariant3;
