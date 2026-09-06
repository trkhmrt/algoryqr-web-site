import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

type RouteContext = {
  params: Promise<{ menuId: string; path?: string[] }>;
};

async function handle(request: Request, context: RouteContext, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
  const { menuId, path } = await context.params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  return proxyAuthenticatedRequest(request, `/menus/${menuId}/ai-import${suffix}`, method);
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context, "POST");
}

export async function PUT(request: Request, context: RouteContext) {
  return handle(request, context, "PUT");
}

export async function PATCH(request: Request, context: RouteContext) {
  return handle(request, context, "PATCH");
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context, "DELETE");
}
