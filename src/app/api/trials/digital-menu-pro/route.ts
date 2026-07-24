import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/trials/status", "GET");
}

export function POST(request: Request) {
  return proxyAuthenticatedRequest(request, "/trials/digital-menu-pro", "POST");
}
