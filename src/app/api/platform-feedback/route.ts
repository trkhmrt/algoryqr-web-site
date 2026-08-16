import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(request: Request) {
  return proxyAuthenticatedRequest(request, "/platform-feedback", "POST");
}

export async function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/platform-feedback/my", "GET");
}
