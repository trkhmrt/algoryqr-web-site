"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { QrCode, Globe, Smartphone, Mail, Wifi, CreditCard, MapPin } from "lucide-react";

interface BeamPath {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const outerIcons = [
  { icon: Globe, label: "URL" },
  { icon: Mail, label: "Email" },
  { icon: CreditCard, label: "vCard" },
  { icon: MapPin, label: "Konum" },
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Smartphone, label: "Uygulama" },
];

const AnimatedBeam = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<BeamPath[]>([]);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  const calculatePaths = useCallback(() => {
    if (!containerRef.current || !centerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const centerRect = centerRef.current.getBoundingClientRect();

    const centerX = centerRect.left + centerRect.width / 2 - containerRect.left;
    const centerY = centerRect.top + centerRect.height / 2 - containerRect.top;

    const newPaths: BeamPath[] = [];
    nodeRefs.current.forEach((node) => {
      if (!node) return;
      const nodeRect = node.getBoundingClientRect();
      const nodeX = nodeRect.left + nodeRect.width / 2 - containerRect.left;
      const nodeY = nodeRect.top + nodeRect.height / 2 - containerRect.top;
      newPaths.push({
        from: { x: nodeX, y: nodeY },
        to: { x: centerX, y: centerY },
      });
    });
    setPaths(newPaths);
  }, []);

  useEffect(() => {
    calculatePaths();
    window.addEventListener("resize", calculatePaths);
    return () => window.removeEventListener("resize", calculatePaths);
  }, [calculatePaths, isInView]);

  return (
    <section ref={sectionRef} className="py-[clamp(3rem,7vw,6rem)] relative overflow-hidden">
      <div className="container mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4"
        >
          <p className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-widest">Entegrasyonlar</p>
          <h2
            className="font-bold text-balance"
            style={{ fontSize: "clamp(1.75rem, 1.2rem + 2.2vw, 3rem)", lineHeight: 1.15 }}
          >
            QR ile her şeyi bağlayın
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto text-pretty">
            URL, dijital menü, Wi-Fi, vCard ve daha fazlası — tek platformda oluşturun, yapay zeka ile yönetin.
          </p>
        </motion.div>

        <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
          {outerIcons.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-3 min-w-0"
            >
              <span className="h-9 w-9 shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-3 flex items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-card px-3 py-3.5">
            <QrCode className="h-5 w-5 text-foreground" />
            <span className="text-sm font-bold tracking-tight">
              Algory<span className="text-muted-foreground">QR</span>
            </span>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative hidden md:flex max-w-xl mx-auto w-full aspect-square items-center justify-center"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {paths.map((path, i) => {
              const id = `beam-gradient-${i}`;

              return (
                <g key={i}>
                  <line
                    x1={path.from.x}
                    y1={path.from.y}
                    x2={path.to.x}
                    y2={path.to.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                  />
                  <defs>
                    <linearGradient id={id} gradientUnits="userSpaceOnUse"
                      x1={path.from.x} y1={path.from.y}
                      x2={path.to.x} y2={path.to.y}
                    >
                      <motion.stop
                        offset="0%"
                        stopColor="hsl(var(--foreground))"
                        stopOpacity={0}
                        animate={{
                          stopOpacity: [0, 0, 0],
                        }}
                      />
                      <motion.stop
                        offset="0%"
                        stopColor="hsl(var(--foreground))"
                        stopOpacity={0}
                        animate={{
                          offset: ["0%", "100%"],
                          stopOpacity: [0, 0.6, 0],
                        }}
                        transition={{
                          duration: 2 + i * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4,
                        }}
                      />
                      <motion.stop
                        offset="0%"
                        stopColor="hsl(var(--foreground))"
                        stopOpacity={0}
                        animate={{
                          offset: ["0%", "100%"],
                          stopOpacity: [0, 0],
                        }}
                        transition={{
                          duration: 2 + i * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4,
                        }}
                      />
                    </linearGradient>
                  </defs>
                  <line
                    x1={path.from.x}
                    y1={path.from.y}
                    x2={path.to.x}
                    y2={path.to.y}
                    stroke={`url(#${id})`}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          <motion.div
            ref={centerRef}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
            className="relative z-10 h-20 w-20 rounded-full border-2 border-border bg-card flex flex-col items-center justify-center gap-1 shadow-lg"
          >
            <QrCode className="h-6 w-6 text-foreground" />
            <span className="text-[8px] font-bold tracking-tight text-foreground leading-none">
              Algory<span className="text-muted-foreground">QR</span>
            </span>
          </motion.div>

          {outerIcons.map((item, i) => {
            const angle = (i * 360) / outerIcons.length - 90;
            const radius = 42;
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

            return (
              <div
                key={i}
                ref={(el) => { nodeRefs.current[i] = el; }}
                className="absolute z-10 h-12 w-12 rounded-full border border-border bg-card flex items-center justify-center shadow-sm hover:border-foreground/30 hover:shadow-md transition-all duration-300 group cursor-default"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnimatedBeam;
