"use client";

import { useCallback, useEffect, useRef, type ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MediaPlaceholder } from "@/components/site/MediaPlaceholder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeatureCarouselItem = {
  title: string;
  text: string;
  img?: string;
  alt?: string;
  step?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  placeholder?: {
    label: string;
    hint?: string;
  };
};

type FeatureCarouselProps = {
  items: FeatureCarouselItem[];
  className?: string;
  /** Otomatik kaydırma aralığı (ms). Varsayılan: 4500 */
  autoplayMs?: number;
};

const SCROLL_END_THRESHOLD = 12;
const DEFAULT_AUTOPLAY_MS = 4500;

export function FeatureCarousel({
  items,
  className,
  autoplayMs = DEFAULT_AUTOPLAY_MS,
}: FeatureCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const pauseUntilRef = useRef(0);

  const getScrollStep = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 0;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 16;
    return card ? card.offsetWidth + gap : el.clientWidth * 0.85;
  }, []);

  const isAtEnd = useCallback((el: HTMLDivElement) => {
    return el.scrollLeft + el.clientWidth >= el.scrollWidth - SCROLL_END_THRESHOLD;
  }, []);

  const canScroll = useCallback((el: HTMLDivElement) => {
    return el.scrollWidth > el.clientWidth + SCROLL_END_THRESHOLD;
  }, []);

  const pauseAutoplay = useCallback(
    (durationMs = autoplayMs * 2) => {
      pauseUntilRef.current = Date.now() + durationMs;
    },
    [autoplayMs],
  );

  const isAutoplayPaused = useCallback(() => {
    if (hoveredRef.current) return true;
    return Date.now() < pauseUntilRef.current;
  }, []);

  const scrollNext = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el || !canScroll(el)) return;

      if (isAtEnd(el)) {
        el.scrollTo({ left: 0, behavior });
        return;
      }

      el.scrollBy({ left: getScrollStep(), behavior });
    },
    [canScroll, getScrollStep, isAtEnd],
  );

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = scrollerRef.current;
      if (!el) return;

      pauseAutoplay();

      if (direction === "right") {
        scrollNext();
        return;
      }

      const amount = getScrollStep();
      if (el.scrollLeft <= SCROLL_END_THRESHOLD) {
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
        return;
      }

      el.scrollBy({ left: -amount, behavior: "smooth" });
    },
    [getScrollStep, pauseAutoplay, scrollNext],
  );

  useEffect(() => {
    if (items.length <= 1) return;

    const id = window.setInterval(() => {
      if (isAutoplayPaused()) return;
      scrollNext();
    }, autoplayMs);

    return () => window.clearInterval(id);
  }, [autoplayMs, isAutoplayPaused, items.length, scrollNext]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-border bg-background shadow-sm sm:flex"
        onClick={() => scroll("left")}
        aria-label="Önceki"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 rounded-full border-border bg-background shadow-sm sm:flex"
        onClick={() => scroll("right")}
        aria-label="Sonraki"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="flex items-center justify-end gap-2 sm:hidden">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("left")} aria-label="Önceki">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("right")} aria-label="Sonraki">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollerRef}
        className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] sm:mt-0 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <article
            key={item.step ?? `${item.title}-${index}`}
            data-carousel-card
            className="group flex w-[min(88vw,340px)] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card/50 p-8 transition-colors hover:border-foreground/15 sm:w-[360px] sm:p-10"
          >
            {item.step ? (
              <span className="font-mono text-xs tracking-widest text-primary">{item.step}</span>
            ) : null}
            <h3
              className={cn(
                "text-[clamp(1.5rem,3vw,2rem)] font-extrabold leading-[1.08] tracking-[-0.03em]",
                item.step && "mt-4",
              )}
            >
              {item.title}
            </h3>
            <p className="mt-4 flex-1 text-base leading-relaxed text-muted-foreground sm:text-lg">{item.text}</p>
            {item.img ? (
              <div className="mt-10 grid place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.alt ?? ""}
                  loading="lazy"
                  decoding="async"
                  width={1024}
                  height={1024}
                  className="h-44 w-auto max-w-full object-contain transition-transform duration-700 ease-out group-hover:-translate-y-1.5 sm:h-52"
                />
              </div>
            ) : item.placeholder ? (
              <MediaPlaceholder
                label={item.placeholder.label}
                hint={item.placeholder.hint}
                aspect="wide"
                className="mt-10 min-h-[140px]"
              />
            ) : item.icon ? (
              <div className="mt-10 grid place-items-center">
                <span className="flex h-28 w-28 items-center justify-center rounded-3xl border border-border bg-background sm:h-32 sm:w-32">
                  <item.icon className="h-12 w-12 text-primary" aria-hidden />
                </span>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
