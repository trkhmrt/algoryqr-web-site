import { APP_URL } from "@/lib/config";

const UNUSABLE_HOSTNAMES = new Set(["0.0.0.0", "[::]", "::", "127.0.0.1", "localhost"]);

function firstHeaderValue(value: string | null): string | null {
  const trimmed = value?.split(",")[0]?.trim();
  return trimmed || null;
}

function isUsableHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return false;
  return !UNUSABLE_HOSTNAMES.has(hostname);
}

/** Public site origin for redirects and 3DS callback URLs. */
export function getAppOrigin(req: Request): string {
  if (APP_URL) return APP_URL;

  const forwardedHost = firstHeaderValue(req.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(req.headers.get("x-forwarded-proto"));
  if (forwardedHost && isUsableHost(forwardedHost)) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = firstHeaderValue(req.headers.get("host"));
  if (host && isUsableHost(host)) {
    return `${forwardedProto ?? "http"}://${host}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return APP_URL || "http://localhost:3000";
}
