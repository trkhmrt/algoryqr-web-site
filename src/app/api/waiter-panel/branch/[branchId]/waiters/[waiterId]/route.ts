import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ branchId: string; waiterId: string }> },
) {
  const { branchId, waiterId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/branch/${branchId}/waiters/${waiterId}`,
    "PATCH",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ branchId: string; waiterId: string }> },
) {
  const { branchId, waiterId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/branch/${branchId}/waiters/${waiterId}`,
    "DELETE",
  );
}
