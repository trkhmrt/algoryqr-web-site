import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const path = query ? `/waiter/campaigns/customers?${query}` : "/waiter/campaigns/customers";
  return proxyWaiterAuthenticatedRequest(request, path, "GET");
}
