import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

export async function isPaymentPendingOnService(conversationId: string): Promise<boolean> {
  try {
    const upstream = await axios.get<{ status?: string }>(
      `${API_BASE_URL}/payments/${encodeURIComponent(conversationId)}`,
      {
        headers: { Accept: "application/json" },
        validateStatus: () => true,
        timeout: 15_000,
      },
    );
    if (upstream.status < 200 || upstream.status >= 300) return false;
    return upstream.data?.status === "PENDING";
  } catch {
    return false;
  }
}
