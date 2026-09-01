"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const HOME_SECTIONS = ["why-us", "pricing"] as const;

export type NavbarActiveSection = (typeof HOME_SECTIONS)[number] | "contact" | null;

export function useNavbarActiveSection(): NavbarActiveSection {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<NavbarActiveSection>(null);

  useEffect(() => {
    if (pathname.startsWith("/contact")) {
      setActiveSection("contact");
      return;
    }

    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    const elements = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element != null,
    );

    if (elements.length === 0) {
      setActiveSection(null);
      return;
    }

    const visibleSections = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!entry.isIntersecting) {
            visibleSections.delete(id);
            continue;
          }
          visibleSections.set(id, entry.intersectionRatio);
        }

        const nextActive = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        setActiveSection(
          nextActive === "why-us" || nextActive === "pricing" ? nextActive : null,
        );
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      visibleSections.clear();
    };
  }, [pathname]);

  return activeSection;
}
