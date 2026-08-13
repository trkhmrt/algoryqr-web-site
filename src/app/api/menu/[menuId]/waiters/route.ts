import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ menuId: string }> },
) {
  const { menuId } = await context.params;
  return proxyAuthenticatedRequest(request, `/menu/${menuId}/waiters`, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ menuId: string }> },
) {
  const { menuId } = await context.params;
  return proxyAuthenticatedRequest(request, `/menu/${menuId}/waiters`, "POST");
}
