import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const menuId = url.searchParams.get("menuId");
  const path = menuId
    ? `/waiter/campaigns/grant?menuId=${encodeURIComponent(menuId)}`
    : "/waiter/campaigns/grant";
  return proxyWaiterAuthenticatedRequest(request, path, "POST");
}
