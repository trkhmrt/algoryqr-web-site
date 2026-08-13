import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ menuId: string; reservationId: string }> },
) {
  const { menuId, reservationId } = await context.params;
  return proxyAuthenticatedRequest(
    request,
    `/menu/${menuId}/reservations/${reservationId}`,
    "PATCH",
  );
}
