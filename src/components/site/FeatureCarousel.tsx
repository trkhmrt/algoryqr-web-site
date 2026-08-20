"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

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

type CarouselOrientation = "horizontal" | "vertical";

type FeatureCarouselProps = {
  items: FeatureCarouselItem[];
  className?: string;
  autoplayMs?: number;
  orientation?: CarouselOrientation | "responsive";
};

const SCROLL_END_THRESHOLD = 12;
const DEFAULT_AUTOPLAY_MS = 4500;
const SM_MIN_WIDTH = 640;

function useResolvedOrientation(orientation: CarouselOrientation | "responsive"): CarouselOrientation {
  const [resolved, setResolved] = useState<CarouselOrientation>(() =>
    orientation === "responsive" ? "horizontal" : orientation,
  );

  useEffect(() => {
    if (orientation !== "responsive") {
      setResolved(orientation);
      return;
    }

    const media = window.matchMedia(`(min-width: ${SM_MIN_WIDTH}px)`);
    const sync = () => setResolved(media.matches ? "vertical" : "horizontal");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [orientation]);

  return resolved;
}

export function FeatureCarousel({
  items,
  className,
  autoplayMs = DEFAULT_AUTOPLAY_MS,
  orientation = "horizontal",
}: FeatureCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const axis = useResolvedOrientation(orientation);
  const isVertical = axis === "vertical";

  const getScrollStep = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 0;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 16;
    if (!card) {
      return isVertical ? el.clientHeight * 0.85 : el.clientWidth * 0.85;
    }
    return isVertical ? card.offsetHeight + gap : card.offsetWidth + gap;
  }, [isVertical]);

  const isAtEnd = useCallback(
    (el: HTMLDivElement) => {
      if (isVertical) {
        return el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_END_THRESHOLD;
      }
      return el.scrollLeft + el.clientWidth >= el.scrollWidth - SCROLL_END_THRESHOLD;
    },
    [isVertical],
  );

  const canScroll = useCallback(
    (el: HTMLDivElement) => {
      if (isVertical) {
        return el.scrollHeight > el.clientHeight + SCROLL_END_THRESHOLD;
      }
      return el.scrollWidth > el.clientWidth + SCROLL_END_THRESHOLD;
    },
    [isVertical],
  );

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
        el.scrollTo(isVertical ? { top: 0, behavior } : { left: 0, behavior });
        return;
      }

      el.scrollBy(isVertical ? { top: getScrollStep(), behavior } : { left: getScrollStep(), behavior });
    },
    [canScroll, getScrollStep, isAtEnd, isVertical],
  );

  const scroll = useCallback(
    (direction: "prev" | "next") => {
      const el = scrollerRef.current;
      if (!el) return;

      pauseAutoplay();

      if (direction === "next") {
        scrollNext();
        return;
      }

      const amount = getScrollStep();
      if (isVertical) {
        if (el.scrollTop <= SCROLL_END_THRESHOLD) {
          el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: "smooth" });
          return;
        }
        el.scrollBy({ top: -amount, behavior: "smooth" });
        return;
      }

      if (el.scrollLeft <= SCROLL_END_THRESHOLD) {
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
        return;
      }

      el.scrollBy({ left: -amount, behavior: "smooth" });
    },
    [getScrollStep, isVertical, pauseAutoplay, scrollNext],
  );

  useEffect(() => {
    if (items.length <= 1) return;

    const id = window.setInterval(() => {
      if (isAutoplayPaused()) return;
      scrollNext();
    }, autoplayMs);

    return () => window.clearInterval(id);
  }, [autoplayMs, isAutoplayPaused, items.length, scrollNext]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0 });
  }, [axis]);

  return (
    <div
      className={cn("relative", isVertical && "flex h-full min-h-0 flex-col", className)}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {isVertical ? (
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("prev")} aria-label="Önceki">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("next")} aria-label="Sonraki">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-border bg-background shadow-sm sm:flex"
            onClick={() => scroll("prev")}
            aria-label="Önceki"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 rounded-full border-border bg-background shadow-sm sm:flex"
            onClick={() => scroll("next")}
            aria-label="Sonraki"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="flex items-center justify-end gap-2 sm:hidden">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("prev")} aria-label="Önceki">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll("next")} aria-label="Sonraki">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <div
        ref={scrollerRef}
        className={cn(
          "scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isVertical
            ? "flex min-h-0 flex-1 snap-y snap-mandatory flex-col gap-4 overflow-y-auto overflow-x-hidden pr-1"
            : "mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mt-0 sm:px-6",
        )}
      >
        {items.map((item, index) => (
          <article
            key={item.step ?? `${item.title}-${index}`}
            data-carousel-card
            className={cn(
              "group flex shrink-0 snap-start flex-col rounded-3xl border border-border bg-card/50 p-8 transition-colors hover:border-foreground/15 sm:p-10",
              isVertical ? "w-full" : "w-[min(88vw,340px)] sm:w-[360px]",
            )}
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
