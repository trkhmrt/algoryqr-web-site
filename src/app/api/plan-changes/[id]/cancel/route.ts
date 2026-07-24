import { proxyAuthenticatedRequest } from "@/lib/server/authenticated-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ message: "Gecersiz id" }, { status: 400 });
  }
  return proxyAuthenticatedRequest(request, `/plan-changes/${id}/cancel`, "POST");
}
