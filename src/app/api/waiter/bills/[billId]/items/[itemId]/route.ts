import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function PUT(
  request: Request,
  context: { params: Promise<{ billId: string; itemId: string }> },
) {
  const { billId, itemId } = await context.params;
  return proxyWaiterAuthenticatedRequest(
    request,
    `/waiter/bills/${billId}/items/${itemId}`,
    "PUT",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ billId: string; itemId: string }> },
) {
  const { billId, itemId } = await context.params;
  return proxyWaiterAuthenticatedRequest(
    request,
    `/waiter/bills/${billId}/items/${itemId}`,
    "DELETE",
  );
}
