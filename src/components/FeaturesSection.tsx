import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Dinamik QR Kodları",
    description: "İçeriği istediğiniz zaman değiştirin, yeniden yazdırmanıza gerek yok.",
  },
  {
    icon: BarChart3,
    title: "Detaylı Analitik",
    description: "Tarama sayısı, konum, cihaz ve zaman bazlı istatistikler.",
  },
  {
    icon: Palette,
    title: "Tam Özelleştirme",
    description: "Renk, logo, çerçeve ve şekillerle markanıza uygun QR kodlar.",
  },
  {
    icon: Zap,
    title: "Anında Oluşturma",
    description: "Saniyeler içinde profesyonel QR kodlarınızı oluşturun.",
  },
  {
    icon: Globe,
    title: "Toplu Oluşturma",
    description: "CSV yükleme ile yüzlerce QR kodu tek seferde oluşturun.",
  },
  {
    icon: Shield,
    title: "Güvenli & Güvenilir",
    description: "SSL şifreleme ve %99.9 uptime garantisi.",
  },
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Özellikler</p>
          <h2 className="text-4xl md:text-5xl font-bold">
            Her şey tek bir platformda
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            QR kod yönetimi için ihtiyacınız olan tüm araçlar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group rounded-xl border border-border bg-card/50 p-6 hover:border-foreground/20 transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="h-5 w-5 text-foreground/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
