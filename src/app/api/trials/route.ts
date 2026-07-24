import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export function POST(request: Request) {
  return proxyAuthenticatedRequest(request, "/trials", "POST");
}
