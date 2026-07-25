"use client";

import { useEffect, useRef } from "react";

import { useMenuProductFeed } from "./use-public-menu-products";

type MenuProductScrollSentinelProps = {
  className?: string;
};

export function MenuProductScrollSentinel({ className }: MenuProductScrollSentinelProps) {
  const { hasNext, isFetchingNextPage, fetchNextPage } = useMenuProductFeed();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNext, fetchNextPage]);

  if (!hasNext && !isFetchingNextPage) return null;

  return (
    <div
      ref={ref}
      className={className ?? "flex min-h-8 items-center justify-center py-4 text-sm opacity-60"}
      aria-hidden={!isFetchingNextPage}
    >
      {isFetchingNextPage ? "Yükleniyor…" : null}
    </div>
  );
}
