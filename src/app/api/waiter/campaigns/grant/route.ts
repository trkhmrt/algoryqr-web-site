import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function POST(request: Request) {
  return proxyWaiterAuthenticatedRequest(request, "/waiter/campaigns/grant", "POST");
}
