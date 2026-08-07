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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isPackageCode(value: string): value is PackageCode {
  return value === "FREE_PACKAGE" || value === "PRO_PACKAGE" || value === "ULTIMATE_PACKAGE";
}

function normalizeProductCode(value: string): ProductCode | null {
  if (value === "QR_CREATE" || value === "QR_MENU" || value === "QR_AGENT" || value === "QR_ANALYTICS") {
    return value;
  }
  if (value === "SMART_REPORTING") return "QR_ANALYTICS";
  if (value === "SMART_ASSISTANT") return "QR_AGENT";
  return null;
}

function normalizeProductScope(value: string): ProductScope | null {
  if (value === "QR_CREATE_OWNER" || value === "QR_MENU_OWNER" || value === "QR_ANALYTICS_OWNER") {
    return value;
  }
  return null;
}

function mergeLiveProfile(tokenProfile: AccessProfile, live: LiveAccessProfile): AccessProfile {
  const activePackageRaw = typeof live.activePackage === "string" ? live.activePackage : null;
  const products = readStringArray(live.products)
    .map(normalizeProductCode)
    .filter((item): item is ProductCode => item != null);
  const scopes = readStringArray(live.scopes)
    .map(normalizeProductScope)
    .filter((item): item is ProductScope => item != null);
  return {
    activePackage: activePackageRaw && isPackageCode(activePackageRaw) ? activePackageRaw : null,
    products: [...new Set(products)],
    scopes: [...new Set(scopes)],
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
