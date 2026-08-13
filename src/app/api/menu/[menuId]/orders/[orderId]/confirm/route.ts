import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ menuId: string; orderId: string }> },
) {
  const { menuId, orderId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/menu/${menuId}/orders/${orderId}/confirm`,
    "POST",
  );
}
