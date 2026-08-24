type YemekSepetiWordmarkSvgProps = {
  className?: string;
};

const YEMEK_SEPETI_PINK = "#FA0050";

export function YemekSepetiWordmarkSvg({ className }: YemekSepetiWordmarkSvgProps) {
  return (
    <svg
      viewBox="0 0 640 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label="Yemek Sepeti"
    >
      <rect width="640" height="96" rx="20" fill={YEMEK_SEPETI_PINK} />
      <text
        x="320"
        y="62"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif"
        fontSize="36"
        fontWeight="700"
        letterSpacing="-0.02em"
        fill="#FFFFFF"
      >
        Yemek Sepeti
      </text>
    </svg>
  );
}
