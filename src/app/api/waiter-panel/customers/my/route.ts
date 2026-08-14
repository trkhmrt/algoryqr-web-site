import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(request: Request) {
  return proxyAuthenticatedRequest(request, "/waiter-panel/customers/my", "GET");
}
