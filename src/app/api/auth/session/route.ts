import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAccessProfileFromToken,
  type AccessProfile,
  type PackageCode,
  type ProductCode,
  type ProductScope,
} from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import { readAccessTokenFromCookies } from "@/lib/server/auth-cookies";

type LiveAccessProfile = {
  activePackage?: string | null;
  products?: unknown;
  scopes?: unknown;
};

const PACKAGE_CODES = new Set<string>([
  "FREE_PACKAGE",
  "STARTER_PACKAGE",
  "PRO_PACKAGE",
  "ULTIMATE_PACKAGE",
  "CORPORATE_PACKAGE",
]);

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isPackageCode(value: string): value is PackageCode {
  return PACKAGE_CODES.has(value);
}

function normalizeProductCode(value: string): ProductCode | null {
  const known = [
    "QR_CREATE",
    "QR_MENU",
    "MENU_PRODUCT",
    "WAITER_PANEL",
    "SMART_ASSISTANT",
    "SMART_SUMMARY",
    "SMART_REPORTING",
    "CUSTOM_DESIGN",
    "QR_AGENT",
    "QR_ANALYTICS",
  ] as const;
  if ((known as readonly string[]).includes(value)) return value as ProductCode;
  if (value === "SMART_REPORTING") return "SMART_REPORTING";
  if (value === "SMART_ASSISTANT") return "SMART_ASSISTANT";
  if (value === "SMART_SUMMARY") return "SMART_SUMMARY";
  return null;
}

function normalizeProductScope(value: string): ProductScope | null {
  const known = [
    "QR_CREATE_OWNER",
    "QR_MENU_OWNER",
    "MENU_PRODUCT_OWNER",
    "WAITER_PANEL_OWNER",
    "SMART_ASSISTANT_OWNER",
    "SMART_SUMMARY_OWNER",
    "SMART_REPORTING_OWNER",
    "CUSTOM_DESIGN_OWNER",
    "QR_ANALYTICS_OWNER",
  ] as const;
  if ((known as readonly string[]).includes(value)) return value as ProductScope;
  return null;
}

function mergeLiveProfile(tokenProfile: AccessProfile, live: LiveAccessProfile): AccessProfile {
  const activePackageRaw = typeof live.activePackage === "string" ? live.activePackage : null;
  const liveProducts = readStringArray(live.products)
    .map(normalizeProductCode)
    .filter((item): item is ProductCode => item != null);
  const liveScopes = readStringArray(live.scopes)
    .map(normalizeProductScope)
    .filter((item): item is ProductScope => item != null);
  const mergedActivePackage =
    activePackageRaw && isPackageCode(activePackageRaw)
      ? activePackageRaw
      : tokenProfile.activePackage;
  return {
    activePackage: mergedActivePackage,
    products: [...new Set([...tokenProfile.products, ...liveProducts])],
    scopes: [...new Set([...tokenProfile.scopes, ...liveScopes])],
    roles: tokenProfile.roles,
    provider: tokenProfile.provider,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) {
    return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  }

  const tokenProfile = getAccessProfileFromToken(accessToken);

  try {
    const upstream = await axios.get<LiveAccessProfile>(`${API_BASE_URL}/auth/access-profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
      timeout: 20_000,
    });

    if (upstream.status >= 200 && upstream.status < 300 && upstream.data) {
      return NextResponse.json(mergeLiveProfile(tokenProfile, upstream.data));
    }
  } catch {
  }

  return NextResponse.json(tokenProfile);
}
