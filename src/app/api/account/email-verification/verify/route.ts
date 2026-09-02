import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(request: Request) {
  return proxyAuthenticatedRequest(request, "/account/email-verification/verify", "POST");
}
