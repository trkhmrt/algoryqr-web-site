"use client";

import { cn } from "@/lib/utils";

export interface PerspectiveMarqueeProps {
  items?: string[];
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  rotateY?: number;
  rotateX?: number;
  perspective?: number;
  fadeColor?: string;
  background?: string;
  durationSeconds?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const DEFAULT_ITEMS = [
  "Vercel",
  "Linear",
  "Stripe",
  "Figma",
  "Notion",
  "Raycast",
  "Arc",
  "Cursor",
];

export function PerspectiveMarquee({
  items = DEFAULT_ITEMS,
  fontSize = 84,
  color = "#fafafa",
  fontWeight = 700,
  rotateY = -28,
  rotateX = 8,
  perspective = 1200,
  fadeColor = "#050505",
  background = "#050505",
  durationSeconds = 28,
  className,
}: PerspectiveMarqueeProps) {
  const itemPadding = fontSize * 0.9;
  const track = [...items, ...items];

  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", className)}
      style={{
        background,
        perspective: `${perspective}px`,
      }}
    >
      <div
        className="flex w-full items-center justify-start"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="flex w-max whitespace-nowrap will-change-transform"
          style={{
            animation: `marquee ${durationSeconds}s linear infinite`,
          }}
        >
          {track.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-block"
              style={{
                fontFamily: FONT_FAMILY,
                fontSize,
                fontWeight,
                color,
                letterSpacing: "-0.03em",
                paddingRight: itemPadding,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${fadeColor} 0%, transparent 18%, transparent 82%, ${fadeColor} 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${fadeColor} 0%, transparent 25%, transparent 75%, ${fadeColor} 100%)`,
        }}
      />
    </div>
  );
}
