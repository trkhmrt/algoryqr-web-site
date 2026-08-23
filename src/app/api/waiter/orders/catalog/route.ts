import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const path = query ? `/waiter/orders/catalog?${query}` : "/waiter/orders/catalog";
  return proxyWaiterAuthenticatedRequest(request, path, "GET");
}
