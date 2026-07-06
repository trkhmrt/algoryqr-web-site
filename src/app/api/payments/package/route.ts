import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/auth-user";
import { API_BASE_URL } from "@/lib/config";
import {
  buildPackagePaymentRequest,
  createPackageConversationId,
  isFreePackage,
  type PackagePaymentCardInput,
} from "@/lib/package-payment";
import type { PlanPackageApiItem } from "@/lib/api";
import { getClientIp, getAppOrigin, grantPackageToUser } from "@/lib/server/package-purchase";
import { readAccessTokenFromCookies, readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";
import { savePendingThreeDsPaymentAliases } from "@/lib/server/pending-three-ds";
import {
  createThreeDsPendingToken,
  THREE_DS_PENDING_COOKIE,
  threeDsPendingCookieOptions,
} from "@/lib/server/three-ds-session";

type PackageCheckoutBody = {
  packageId?: number;
  use3ds?: boolean;
  card?: PackagePaymentCardInput;
};

type PaymentErrorBody = {
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string> | null;
};

function paymentErrorMessage(data: unknown): string {
  if (typeof data !== "object" || data == null) return "Ödeme başlatılamadı";
  const body = data as PaymentErrorBody;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  return "Ödeme başlatılamadı";
}

async function loadPackage(packageId: number): Promise<PlanPackageApiItem | null> {
  const upstream = await axios.get<PlanPackageApiItem[]>(`${API_BASE_URL}/packages`, {
    validateStatus: () => true,
    timeout: 20_000,
  });
  if (upstream.status < 200 || upstream.status >= 300) return null;
  const list = Array.isArray(upstream.data) ? upstream.data : [];
  return list.find((item) => item.id === packageId) ?? null;
}

async function loadBuyerProfile(accessToken: string, userId: string, ip: string) {
  const authUser = getUserFromAccessToken(accessToken);
  try {
    const upstream = await axios.get<{
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
    }>(`${API_BASE_URL}/account/myprofile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-User-Id": userId,
        Accept: "application/json",
      },
      validateStatus: () => true,
      timeout: 20_000,
    });
    if (upstream.status >= 200 && upstream.status < 300) {
      return {
        firstName: upstream.data.firstName ?? authUser?.first_name ?? "Müşteri",
        lastName: upstream.data.lastName ?? authUser?.last_name ?? "Kullanıcı",
        email: upstream.data.email ?? authUser?.email ?? "musteri@algoryqr.com",
        phoneNumber: upstream.data.phoneNumber ?? null,
      };
    }
  } catch {
    // fall through to JWT claims
  }
  return {
    firstName: authUser?.first_name ?? "Müşteri",
    lastName: authUser?.last_name ?? "Kullanıcı",
    email: authUser?.email || "musteri@algoryqr.com",
    phoneNumber: null,
  };
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = readAccessTokenFromCookies(cookieStore);
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const authUser = getUserFromAccessToken(accessToken);
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ message: "Kullanıcı bilgisi bulunamadı" }, { status: 401 });
    }

    const body = (await req.json()) as PackageCheckoutBody;
    const packageId = body.packageId;
    if (packageId == null || !Number.isFinite(packageId)) {
      return NextResponse.json({ message: "Paket id zorunludur" }, { status: 400 });
    }

    const pkg = await loadPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ message: "Paket bulunamadı" }, { status: 404 });
    }

    if (isFreePackage(pkg)) {
      await grantPackageToUser(accessToken, packageId);
      return NextResponse.json({ success: true, mode: "free" });
    }

    const card = body.card;
    if (!card?.cardholderName || !card.cardNumber || !card.expiry || !card.cvv) {
      return NextResponse.json({ message: "Kart bilgileri eksik" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const profile = await loadBuyerProfile(accessToken, String(userId), ip);
    const conversationId = createPackageConversationId(packageId, userId);
    const use3ds = body.use3ds === true;
    const callbackUrl = use3ds
      ? `${getAppOrigin(req)}/api/payments/three-ds/callback?packageId=${packageId}`
      : undefined;

    const paymentBody = buildPackagePaymentRequest({
      pkg,
      card,
      buyer: {
        userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        ip,
      },
      conversationId,
      callbackUrl,
    });

    const paymentPath = use3ds ? "/payments/three-ds" : "/payments";
    const upstream = await axios.post(`${API_BASE_URL}${paymentPath}`, paymentBody, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      validateStatus: () => true,
      timeout: 30_000,
    });

    if (upstream.status < 200 || upstream.status >= 300) {
      const err = upstream.data as PaymentErrorBody;
      return NextResponse.json(
        {
          message: paymentErrorMessage(upstream.data),
          errorCode: err.errorCode ?? null,
          fieldErrors: err.fieldErrors ?? null,
        },
        { status: upstream.status || 502 },
      );
    }

    if (use3ds) {
      const data = upstream.data as { conversationId?: string; htmlContent?: string };
      const resolvedConversationId = data.conversationId ?? conversationId;
      const refreshToken = readRefreshTokenFromCookies(cookieStore);
      const pendingData = {
        packageId,
        userId: String(userId),
        accessToken,
        refreshToken,
      };

      savePendingThreeDsPaymentAliases([conversationId, resolvedConversationId], pendingData);

      const response = NextResponse.json({
        success: true,
        mode: "three-ds",
        conversationId: resolvedConversationId,
        htmlContent: data.htmlContent ?? "",
      });

      response.cookies.set(
        THREE_DS_PENDING_COOKIE,
        createThreeDsPendingToken({
          conversationId,
          packageId,
          userId: String(userId),
          accessToken,
          refreshToken,
        }),
        threeDsPendingCookieOptions(),
      );

      return response;
    }

    await grantPackageToUser(accessToken, packageId);
    return NextResponse.json({
      success: true,
      mode: "direct",
      conversationId: (upstream.data as { conversationId?: string })?.conversationId ?? conversationId,
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ message: "Ödeme servisi zaman aşımı" }, { status: 504 });
      }
      if (error.code === "ECONNREFUSED") {
        return NextResponse.json(
          { message: `Ödeme servisine bağlanılamadı (${API_BASE_URL})` },
          { status: 502 },
        );
      }
    }
    const message = error instanceof Error ? error.message : "Ödeme işlemi başarısız";
    return NextResponse.json({ message }, { status: 500 });
  }
}
