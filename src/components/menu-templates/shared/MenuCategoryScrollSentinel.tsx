"use client";

import { useEffect, useRef } from "react";

import { useMenuCategoryFeed } from "./MenuCategoryFeed";

type MenuCategoryScrollSentinelProps = {
  className?: string;
};

export function MenuCategoryScrollSentinel({ className }: MenuCategoryScrollSentinelProps) {
  const { hasNext, isFetchingNextPage, fetchNextPage } = useMenuCategoryFeed();
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
  }, [fetchNextPage, hasNext]);

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
