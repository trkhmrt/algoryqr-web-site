import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  const { billId } = await context.params;
  return proxyWaiterAuthenticatedRequest(request, `/waiter/bills/${billId}/split-preview`, "GET");
}
