"use client";

type MenuAtmosphereBackdropProps = {
  imageUrl: string;
  variant?: "editorial" | "immersive";
  className?: string;
};

export function MenuAtmosphereBackdrop({
  imageUrl,
  variant = "immersive",
  className = "",
}: MenuAtmosphereBackdropProps) {
  const scrimClass =
    variant === "immersive" ? "menu-atmosphere__scrim--immersive" : "menu-atmosphere__scrim--editorial";

  return (
    <div aria-hidden className={`menu-atmosphere ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="menu-atmosphere__image" loading="eager" decoding="async" />
      <div className={`menu-atmosphere__scrim ${scrimClass}`} />
      <div className="menu-atmosphere__vignette" />
    </div>
  );
}
