import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { parsePackageConversationId } from "@/lib/package-payment";
import { grantPackageToUser } from "@/lib/server/package-purchase";
import { setAuthCookies } from "@/lib/server/auth-cookies";
import { takePendingThreeDsPayment } from "@/lib/server/pending-three-ds";
import {
  completeThreeDsPayment,
  isPaymentPendingOnService,
  isPaymentUpstreamSuccess,
  paymentUpstreamErrorMessage,
} from "@/lib/server/payment-service";
import { resolveAccessTokenForGrant } from "@/lib/server/refresh-access-token";
import {
  clearThreeDsPendingCookie,
  readThreeDsPendingToken,
  THREE_DS_PENDING_COOKIE,
} from "@/lib/server/three-ds-session";

type ResolvedPending = {
  packageId: number;
  userId: string;
  accessToken: string;
  refreshToken: string | null;
};

function buildSubscriptionUrl(origin: string, status: "success" | "failed", message?: string) {
  const url = new URL(DASHBOARD_ROUTES.accountSubscription, origin);
  url.searchParams.set("payment", status);
  if (message) url.searchParams.set("message", message);
  return url.toString();
}

function redirectToSubscription(
  origin: string,
  status: "success" | "failed",
  message?: string,
  auth?: { accessToken: string; refreshToken?: string },
) {
  const targetUrl = buildSubscriptionUrl(origin, status, message);
  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>Yönlendiriliyor…</title></head>
<body>
<p>Ödeme tamamlanıyor, yönlendiriliyorsunuz…</p>
<script>window.top.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  clearThreeDsPendingCookie(response);

  if (auth) {
    setAuthCookies(response, auth.accessToken, auth.refreshToken);
  }

  return response;
}

async function resolvePendingPayment(
  conversationId: string,
  packageIdFromQuery: number,
  cookieToken: string | undefined,
): Promise<ResolvedPending | null> {
  const fromCookie = readThreeDsPendingToken(cookieToken);
  const parsed = parsePackageConversationId(conversationId);

  const cookieMatches =
    fromCookie &&
    (fromCookie.conversationId === conversationId ||
      (parsed != null &&
        fromCookie.packageId === parsed.packageId &&
        fromCookie.userId === parsed.userId &&
        fromCookie.packageId === packageIdFromQuery));

  if (cookieMatches && fromCookie) {
    return {
      packageId: fromCookie.packageId,
      userId: fromCookie.userId,
      accessToken: fromCookie.accessToken,
      refreshToken: fromCookie.refreshToken,
    };
  }

  const fromMemory = takePendingThreeDsPayment(conversationId);
  if (fromMemory) {
    return fromMemory;
  }

  if (!parsed || parsed.packageId !== packageIdFromQuery) return null;

  const paymentPending = await isPaymentPendingOnService(conversationId);
  if (!paymentPending) return null;

  return null;
}

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const packageIdRaw = new URL(req.url).searchParams.get("packageId");
  const packageIdFromQuery = packageIdRaw ? Number(packageIdRaw) : NaN;

  if (!Number.isFinite(packageIdFromQuery)) {
    return redirectToSubscription(origin, "failed", "Paket bilgisi eksik");
  }

  const formData = await req.formData();
  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const conversationData = String(formData.get("conversationData") ?? "");
  const mdStatus = String(formData.get("mdStatus") ?? "");
  const status = String(formData.get("status") ?? "");

  if (mdStatus !== "1" || status !== "success") {
    return redirectToSubscription(origin, "failed", "3D Secure doğrulaması tamamlanamadı");
  }

  if (!conversationId || !paymentId) {
    return redirectToSubscription(origin, "failed", "Ödeme bilgisi eksik");
  }

  const cookieStore = await cookies();
  const pending = await resolvePendingPayment(
    conversationId,
    packageIdFromQuery,
    cookieStore.get(THREE_DS_PENDING_COOKIE)?.value,
  );

  if (!pending) {
    return redirectToSubscription(
      origin,
      "failed",
      "Ödeme oturumu bulunamadı. Lütfen tekrar deneyin.",
    );
  }

  if (pending.packageId !== packageIdFromQuery) {
    return redirectToSubscription(origin, "failed", "Paket bilgisi uyuşmuyor");
  }

  try {
    const complete = await completeThreeDsPayment({
      conversationId,
      paymentId,
      conversationData: conversationData || undefined,
      locale: "tr",
    });

    if (!isPaymentUpstreamSuccess(complete.status)) {
      return redirectToSubscription(
        origin,
        "failed",
        paymentUpstreamErrorMessage(complete.data, "3DS ödeme tamamlanamadı"),
      );
    }

    const tokens = await resolveAccessTokenForGrant(pending.accessToken, pending.refreshToken);
    await grantPackageToUser(tokens.accessToken, pending.packageId);
    return redirectToSubscription(origin, "success", undefined, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme tamamlanamadı";
    return redirectToSubscription(origin, "failed", message);
  }
}
