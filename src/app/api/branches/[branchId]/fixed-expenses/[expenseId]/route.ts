import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function PUT(
  request: Request,
  context: { params: Promise<{ branchId: string; expenseId: string }> },
) {
  const { branchId, expenseId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/branches/${branchId}/fixed-expenses/${expenseId}`,
    "PUT",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ branchId: string; expenseId: string }> },
) {
  const { branchId, expenseId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/branches/${branchId}/fixed-expenses/${expenseId}`,
    "DELETE",
  );
}
