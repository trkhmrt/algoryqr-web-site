import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function PUT(
  request: Request,
  context: { params: Promise<{ menuId: string; expenseId: string }> },
) {
  const { menuId, expenseId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/menus/${menuId}/fixed-expenses/${expenseId}`,
    "PUT",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ menuId: string; expenseId: string }> },
) {
  const { menuId, expenseId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/menus/${menuId}/fixed-expenses/${expenseId}`,
    "DELETE",
  );
}
