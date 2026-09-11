import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code || code.trim().length === 0) {
    return Response.json({ message: "Kupon kodu zorunludur" }, { status: 400 });
  }
  return proxyAuthenticatedRequest(request, `/coupons/${encodeURIComponent(code)}`, "GET");
}
