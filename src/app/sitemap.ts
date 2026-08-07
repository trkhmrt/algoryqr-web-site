import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes = [
    "",
    "/hakkimizda",
    "/contact",
    "/gizlilik",
    "/mesafeli-satis",
    "/iade",
    "/login",
    "/register",
  ] as const;

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/hakkimizda" || route === "/contact" ? 0.8 : 0.5,
  }));
}
