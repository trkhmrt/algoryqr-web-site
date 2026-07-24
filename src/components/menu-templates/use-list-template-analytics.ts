"use client";

import { useEffect, type RefObject } from "react";

import type { MenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";

export function useListTemplateCategoryAnalytics(
  analytics: MenuVisitAnalytics | undefined,
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!analytics || !rootRef.current) {
      return;
    }
    const root = rootRef.current;
    const seen = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const categoryId = Number((entry.target as HTMLElement).dataset.analyticsCategory);
          if (!Number.isFinite(categoryId) || seen.has(categoryId)) {
            continue;
          }
          seen.add(categoryId);
          analytics.trackCategoryView(categoryId);
        }
      },
      { threshold: 0.45 },
    );

    root.querySelectorAll<HTMLElement>("[data-analytics-category]").forEach((node) => {
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, [analytics, rootRef]);
}
