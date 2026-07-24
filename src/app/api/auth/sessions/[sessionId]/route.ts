import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/auth/sessions/${encodeURIComponent(sessionId)}`,
    "DELETE",
  );
}
