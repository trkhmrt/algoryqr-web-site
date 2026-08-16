import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await context.params;
  return proxyAuthenticatedRequest(request, `/accounting/entries/${entryId}`, "DELETE");
}
