import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

import {
  DASHBOARD_ICON_WELL,
  DASHBOARD_TILE_SQUARE,
  DASHBOARD_TYPE_META,
  DASHBOARD_TYPE_TILE,
} from "@/lib/dashboard-surface";
import { cn } from "@/lib/utils";

type HubIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type DashboardHubTileProps = {
  title: string;
  description?: string;
  icon?: HubIcon;
  media?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

function TileBody({
  title,
  description,
  icon: Icon,
  media,
}: Pick<DashboardHubTileProps, "title" | "description" | "icon" | "media">) {
  return (
    <>
      {media ?? (
        <span className={DASHBOARD_ICON_WELL}>
          {Icon ? <Icon className="h-6 w-6" strokeWidth={1.75} /> : null}
        </span>
      )}
      <span className={`line-clamp-2 ${DASHBOARD_TYPE_TILE}`}>{title}</span>
      {description ? (
        <span className={`line-clamp-2 ${DASHBOARD_TYPE_META}`}>{description}</span>
      ) : null}
    </>
  );
}

export function DashboardHubTile({
  title,
  description,
  icon,
  media,
  href,
  onClick,
  className,
}: DashboardHubTileProps) {
  const classes = cn(DASHBOARD_TILE_SQUARE, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        <TileBody title={title} description={description} icon={icon} media={media} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <TileBody title={title} description={description} icon={icon} media={media} />
    </button>
  );
}
