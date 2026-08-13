import { proxyPublicTableSessionRequest } from "@/lib/server/customer-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ identifier: string; orderId: string }> },
) {
  const { identifier, orderId } = await context.params;
  return proxyPublicTableSessionRequest(
    request,
    `/menu/public/id/${identifier}/orders/${orderId}`,
    "GET",
  );
}
