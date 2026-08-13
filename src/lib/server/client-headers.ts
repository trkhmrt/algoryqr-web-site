/**
 * Upstream builds session rows (device, browser, IP) from these headers. Server-side
 * requests would otherwise describe the Node process instead of the end user's browser.
 */
export function clientContextHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const forwardedFor =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (forwardedFor) {
    headers["X-Forwarded-For"] = forwardedFor;
  }

  return headers;
}
