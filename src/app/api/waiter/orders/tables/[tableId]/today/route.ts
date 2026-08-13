import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ tableId: string }> },
) {
  const { tableId } = await context.params;
  return proxyWaiterAuthenticatedRequest(
    request,
    `/waiter/orders/tables/${tableId}/today`,
    "GET",
  );
}
