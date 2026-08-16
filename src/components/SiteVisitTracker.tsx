"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SKIP_PREFIXES = ["/dashboard", "/menu", "/api"];

function shouldTrack(pathname: string) {
  return !SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function trackVisit(path: string) {
  const payload = JSON.stringify({
    path,
    referrer: document.referrer || null,
  });

  const url = "/api/analytics/site-visit";
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch(url, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

export function SiteVisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) {
      return;
    }
    if (lastTracked.current === pathname) {
      return;
    }
    lastTracked.current = pathname;
    trackVisit(pathname);
  }, [pathname]);

  return null;
}
