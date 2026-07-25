"use client";

import { PerspectiveMarquee } from "@/components/ui/perspective-marquee";
import { useTheme } from "@/hooks/use-theme";

const MARQUEE_ITEMS = [
  "AlgoryQR",
  "QR Menü",
  "Dinamik Fiyat",
  "Analitik",
  "Şablonlar",
  "Anlık Güncelleme",
  "Mobil",
  "Restoran",
];

export function PerspectiveMarqueeSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="relative w-full overflow-hidden border-t border-border"
      style={{ backgroundColor: isDark ? "#050505" : "#fafafa" }}
      aria-label="AlgoryQR özellik bandı"
    >
      <div className="relative h-[280px] w-full md:h-[360px]">
        <PerspectiveMarquee
          items={MARQUEE_ITEMS}
          rotateY={-28}
          rotateX={8}
          perspective={1200}
          durationSeconds={28}
          background={isDark ? "#050505" : "#fafafa"}
          fadeColor={isDark ? "#050505" : "#fafafa"}
          color={isDark ? "#fafafa" : "#171717"}
        />
      </div>
    </section>
  );
}

export default PerspectiveMarqueeSection;
