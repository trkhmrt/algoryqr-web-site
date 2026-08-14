import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ menuId: string; waiterId: string }> },
) {
  const { menuId, waiterId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/menu/${menuId}/waiters/${waiterId}`,
    "PATCH",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ menuId: string; waiterId: string }> },
) {
  const { menuId, waiterId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/waiter-panel/menu/${menuId}/waiters/${waiterId}`,
    "DELETE",
  );
}
