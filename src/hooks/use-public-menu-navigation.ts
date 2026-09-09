"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildPublicMenuContentPath,
  publicMenuContentPath,
  type PublicMenuLandingPanel,
} from "@/lib/public-menu-paths";
import type { MenuLandingAction } from "@/components/menu-templates/shared/menu-landing";

export function usePublicMenuNavigation(identifier: number | string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t")?.trim() || undefined;

  const isContentRoute = pathname.endsWith("/content");
  const landingPanel: PublicMenuLandingPanel = "landing";

  const active = useMemo((): PublicMenuLandingPanel | "menu" => {
    if (isContentRoute) return "menu";
    return landingPanel;
  }, [isContentRoute, landingPanel]);

  const go = useCallback(
    (key: "landing" | MenuLandingAction) => {
      const contentPath = buildPublicMenuContentPath(identifier, { tableToken });
      const pathOnly = publicMenuContentPath(identifier);
      if (key === "landing" || key === "menu") {
        if (pathname === pathOnly) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        router.push(contentPath);
        return;
      }
      router.push(contentPath);
    },
    [identifier, pathname, router, tableToken],
  );

  return { active, go, isContentRoute, landingPanel };
}
