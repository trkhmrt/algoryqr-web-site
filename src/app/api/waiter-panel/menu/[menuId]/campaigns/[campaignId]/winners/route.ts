import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ menuId: string; campaignId: string }> },
) {
  const { menuId, campaignId } = await context.params;
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const path = query
    ? `/waiter-panel/menu/${menuId}/campaigns/${campaignId}/winners?${query}`
    : `/waiter-panel/menu/${menuId}/campaigns/${campaignId}/winners`;
  return proxyAuthenticatedRequest(request, path, "GET");
}
