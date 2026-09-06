import { proxyPublicTableSessionRequest } from "@/lib/server/customer-authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  const { identifier } = await context.params;
  return proxyPublicTableSessionRequest(
    request,
    `/menu/public/${identifier}/cart`,
    "GET",
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  const { identifier } = await context.params;
  return proxyPublicTableSessionRequest(
    request,
    `/menu/public/${identifier}/cart`,
    "PUT",
  );
}
