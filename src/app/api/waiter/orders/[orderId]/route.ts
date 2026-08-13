import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  return proxyWaiterAuthenticatedRequest(
    request,
    `/waiter/orders/${orderId}`,
    "GET",
  );
}
