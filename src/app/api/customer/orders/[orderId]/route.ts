import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  return proxyCustomerAuthenticatedRequest(request, `/customer/orders/${orderId}`, "GET");
}
