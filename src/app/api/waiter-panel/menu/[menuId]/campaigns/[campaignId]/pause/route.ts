import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ menuId: string; campaignId: string }> },
) {
  const { menuId, campaignId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/menu/${menuId}/campaigns/${campaignId}/pause`,
    "POST",
  );
}
