import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

export async function grantPackageToUser(accessToken: string, packageId: number): Promise<void> {
  const upstream = await axios.post(
    `${API_BASE_URL}/purchases`,
    { packageId },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
      timeout: 20_000,
    },
  );

  if (upstream.status < 200 || upstream.status >= 300) {
    const message =
      (typeof upstream.data === "object" &&
        upstream.data != null &&
        "message" in upstream.data &&
        typeof (upstream.data as { message?: string }).message === "string" &&
        (upstream.data as { message: string }).message) ||
      "Paket tanımlanamadı";
    throw new Error(message);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}
