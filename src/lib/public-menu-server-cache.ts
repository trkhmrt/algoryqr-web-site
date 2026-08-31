import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/config";
import {
  PUBLIC_MENU_CACHE_CONTROL,
  PUBLIC_MENU_REVALIDATE_SECONDS,
} from "@/lib/public-menu-cache";

export { PUBLIC_MENU_REVALIDATE_SECONDS };

export function publicMenuCachedJson(data: unknown, status: number) {
  return NextResponse.json(data ?? {}, {
    status,
    headers: {
      "Cache-Control": PUBLIC_MENU_CACHE_CONTROL,
    },
  });
}

export function searchParamsFromRequest(req: Request): Record<string, string | string[]> {
  const url = new URL(req.url);
  const params: Record<string, string | string[]> = {};
  url.searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing == null) {
      params[key] = value;
      return;
    }
    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }
    params[key] = [existing, value];
  });
  return params;
}

function appendSearchParam(url: URL, key: string, value: string) {
  url.searchParams.append(key, value);
}

export function buildPublicMenuUpstreamUrl(
  path: string,
  params?: Record<string, string | string[]>,
) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (!params) return url.toString();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => appendSearchParam(url, key, entry));
      continue;
    }
    appendSearchParam(url, key, value);
  }
  return url.toString();
}

export async function fetchCachedPublicMenuUpstream(
  path: string,
  params?: Record<string, string | string[]>,
) {
  return fetch(buildPublicMenuUpstreamUrl(path, params), {
    next: { revalidate: PUBLIC_MENU_REVALIDATE_SECONDS },
  });
}

export async function readPublicMenuUpstreamJson(
  path: string,
  params?: Record<string, string | string[]>,
) {
  const upstream = await fetchCachedPublicMenuUpstream(path, params);
  const data = upstream.ok ? await upstream.json().catch(() => ({})) : await upstream.json().catch(() => ({}));
  return { upstream, data };
}
