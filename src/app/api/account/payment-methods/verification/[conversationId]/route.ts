import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/billing/payment-methods/verification/${encodeURIComponent(conversationId)}`,
    "GET",
  );
}
