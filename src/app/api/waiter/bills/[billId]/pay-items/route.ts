import { proxyWaiterAuthenticatedRequest } from "@/lib/server/waiter-authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  const { billId } = await context.params;
  return proxyWaiterAuthenticatedRequest(request, `/waiter/bills/${billId}/pay-items`, "POST");
}
