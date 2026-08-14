import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ menuId: string; tableId: string }> },
) {
  const { menuId, tableId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/menu/${menuId}/tables/${tableId}/regenerate-qr`,
    "POST",
  );
}
