import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/purchases/my/subscription-overview", "GET");
}
