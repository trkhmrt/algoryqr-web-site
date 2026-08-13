import { proxyPublicTableSessionRequest } from "@/lib/server/customer-authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  const { identifier } = await context.params;
  return proxyPublicTableSessionRequest(
    request,
    `/menu/public/id/${identifier}/orders/submit`,
    "POST",
    { forwardCustomerAuth: true },
  );
}
