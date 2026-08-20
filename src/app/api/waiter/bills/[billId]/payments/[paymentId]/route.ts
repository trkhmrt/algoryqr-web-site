import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ billId: string; paymentId: string }> },
) {
  const { billId, paymentId } = await context.params;
  return proxyWaiterAuthenticatedRequest(
    request,
    `/waiter/bills/${billId}/payments/${paymentId}`,
    "DELETE",
  );
}
