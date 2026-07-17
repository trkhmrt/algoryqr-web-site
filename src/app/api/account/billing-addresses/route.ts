import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/billing-addresses", "GET");
}

export function POST(request: Request) {
  return proxyAuthenticatedRequest(request, "/billing-addresses", "POST");
}
