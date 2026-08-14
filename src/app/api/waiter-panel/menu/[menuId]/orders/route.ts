import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ menuId: string }> },
) {
  const { menuId } = await context.params;
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const path = query
    ? `/waiter-panel/menu/${menuId}/orders?${query}`
    : `/waiter-panel/menu/${menuId}/orders`;
  return proxyAuthenticatedRequest(request, path, "GET");
}
