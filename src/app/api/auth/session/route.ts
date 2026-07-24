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

function isProductCode(value: string): value is ProductCode {
  return value === "QR_CREATE" || value === "QR_MENU" || value === "QR_AGENT";
}

function isProductScope(value: string): value is ProductScope {
  return value === "QR_CREATE_OWNER" || value === "QR_MENU_OWNER";
}

function mergeLiveProfile(tokenProfile: AccessProfile, live: LiveAccessProfile): AccessProfile {
  const activePackageRaw = typeof live.activePackage === "string" ? live.activePackage : null;
  return {
    activePackage: activePackageRaw && isPackageCode(activePackageRaw) ? activePackageRaw : null,
    products: readStringArray(live.products).filter(isProductCode),
    scopes: readStringArray(live.scopes).filter(isProductScope),
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
