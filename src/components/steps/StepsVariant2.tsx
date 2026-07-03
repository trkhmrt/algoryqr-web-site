import { motion } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap } from "lucide-react";
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

const StepsVariant2 = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Varyant 2 — Dikey Timeline Kartları
          </span>
        </div>
        <div className="text-center mb-16">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Nasıl Çalışır</p>
          <h2 className="text-4xl md:text-5xl font-bold">4 adımda başlayın</h2>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex items-start gap-6 mb-16 last:mb-0 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                  <div className="h-12 w-12 rounded-full border-2 border-foreground/20 bg-card flex items-center justify-center shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                </div>

                {/* Content card */}
                <div className={`ml-16 md:ml-0 md:w-[calc(50%-40px)] ${isEven ? "md:pr-8" : "md:pl-8"} ${isEven ? "" : "md:ml-auto"}`}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="rounded-xl overflow-hidden mb-4">
                      <img src={step.image} alt={step.title} className="w-full h-44 object-cover" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Adım {i + 1}
                    </span>
                    <h3 className="text-xl font-bold mt-1 mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StepsVariant2;
