import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await context.params;
  return proxyAuthenticatedRequest(request, `/features/SMART_REPORTING/analytics/branch/${branchId}/smart-reports`, "POST");
}
