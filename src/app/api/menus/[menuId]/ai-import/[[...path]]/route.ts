import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

type RouteContext = { params: Promise<{ menuId: string; path?: string[] }> };

async function proxy(
  request: Request,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  context: RouteContext,
) {
  const { menuId, path = [] } = await context.params;
  const suffix = path.length > 0 ? `/${path.join("/")}` : "";
  return proxyAuthenticatedRequest(request, `/menus/${menuId}/ai-import${suffix}`, method);
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, "GET", context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, "POST", context);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxy(request, "PUT", context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxy(request, "PATCH", context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxy(request, "DELETE", context);
}
