import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(request: Request) {
  return proxyWaiterAuthenticatedRequest(request, "/waiter/orders/today", "GET");
}
