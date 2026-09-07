const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function GET(
  request: Request,
  context: { params: Promise<{ identifier: string }> },
) {
  const { identifier } = await context.params;
  const upstream = await fetch(`${API_BASE_URL}/menu/public/${identifier}/campaigns/active`, {
    cache: "no-store",
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
