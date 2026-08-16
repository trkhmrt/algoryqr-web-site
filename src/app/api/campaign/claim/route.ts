import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("c");
  const upstream = await fetch(`${API_BASE_URL}/campaign/claim?c=${encodeURIComponent(token ?? "")}`, {
    cache: "no-store",
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("c");
  return proxyCustomerAuthenticatedRequest(
    request,
    `/campaign/claim?c=${encodeURIComponent(token ?? "")}`,
    "POST",
  );
}
