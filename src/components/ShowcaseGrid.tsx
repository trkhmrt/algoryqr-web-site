import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { QrCode, BarChart3, Palette, Zap, Globe, CalendarDays } from "lucide-react";
import grid1 from "@/assets/grid-1.jpg";
import grid2 from "@/assets/grid-2.jpg";
import grid3 from "@/assets/grid-3.jpg";
import grid4 from "@/assets/grid-4.jpg";

const gridItems = [
  {
    icon: QrCode,
    image: grid1.src,
    title: "Dosyalarınızı Kaydedin",
    description: "QR kodlarınızı otomatik olarak bulutta saklıyoruz.",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    icon: BarChart3,
    image: grid2.src,
    title: "Bildirimler",
    description: "Tarama gerçekleştiğinde anında bilgilendirilin.",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Globe,
    image: grid3.src,
    title: "Entegrasyonlar",
    description: "100+ entegrasyon ile iş akışlarınızı otomatikleştirin.",
    span: "md:col-span-1 md:row-span-2",
  },
  {
    icon: CalendarDays,
    image: grid4.src,
    title: "Takvim",
    description: "Tarama verilerini tarih bazlı filtreleyin.",
    span: "md:col-span-1 md:row-span-1",
  },
];

const ShowcaseGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Platform</p>
          <h2 className="text-4xl md:text-5xl font-bold">Güçlü araçlar, basit arayüz</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto auto-rows-[280px]">
          {gridItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer ${item.span}`}
              >
                {/* Background image area */}
                <div className="absolute inset-0 top-0 h-[55%] overflow-hidden">
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-full object-cover opacity-30 blur-[2px] group-hover:opacity-50 group-hover:blur-0 group-hover:scale-110 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full p-6 flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-foreground/70" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:translate-x-1 transition-transform duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-foreground/10 transition-all duration-500 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseGrid;
