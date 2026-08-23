import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await context.params;
  return proxyAuthenticatedRequest(request, `/analytics/branch/${branchId}/revenue`, "GET");
}
