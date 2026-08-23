import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await context.params;
  return proxyAuthenticatedRequest(request, `/waiter-panel/branch/${branchId}/waiters`, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await context.params;
  return proxyAuthenticatedRequest(request, `/waiter-panel/branch/${branchId}/waiters`, "POST");
}
