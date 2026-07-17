import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyAuthenticatedRequest(request, `/billing-addresses/${encodeURIComponent(id)}`, "PUT");
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyAuthenticatedRequest(request, `/billing-addresses/${encodeURIComponent(id)}`, "DELETE");
}
