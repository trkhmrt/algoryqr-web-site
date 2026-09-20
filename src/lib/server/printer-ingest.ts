import axios from "axios";

import { API_BASE_URL } from "@/lib/config";
import { buildUpstreamAuthHeaders } from "@/lib/auth-user";
import type { MarketplaceLikeOrder } from "@/lib/receipt-ticket";
import { marketplaceOrderToReceipt } from "@/lib/receipt-ticket";
import type { MarketplacePrintSource, PrintTrigger, PrinterAccount } from "@/lib/server/printer-store";
import { enqueuePrintJob } from "@/lib/server/printer-jobs";

type OrderPage = {
  content?: MarketplaceLikeOrder[];
};

function todayIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function matchesTrigger(status: string | undefined, trigger: PrintTrigger): boolean {
  const normalized = status?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";
  if (trigger === "CREATED") return normalized === "created";
  return normalized === "accepted";
}

async function refreshOwnerAccess(account: PrinterAccount): Promise<string | null> {
  if (!account.refreshToken) return account.accessToken ?? null;
  try {
    const upstream = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: account.refreshToken },
      { validateStatus: () => true, timeout: 15_000 },
    );
    const data = upstream.data as { accessToken?: string; refreshToken?: string; access_token?: string; refresh_token?: string };
    const access = data?.accessToken ?? data?.access_token;
    const refresh = data?.refreshToken ?? data?.refresh_token;
    if (typeof access === "string" && access) account.accessToken = access;
    if (typeof refresh === "string" && refresh) account.refreshToken = refresh;
    return account.accessToken ?? null;
  } catch {
    return account.accessToken ?? null;
  }
}

async function listIntegrationOrders(
  accessToken: string,
  source: "YEMEK_SEPETI" | "UBER_EATS",
  status: string,
): Promise<MarketplaceLikeOrder[]> {
  const suffix = source === "YEMEK_SEPETI" ? "yemek-sepeti" : "ubereats";
  const from = todayIsoDate();
  const upstream = await axios.get<OrderPage>(`${API_BASE_URL}/integrations/${suffix}/orders`, {
    params: { status, from, to: from, page: 0, size: 50 },
    headers: buildUpstreamAuthHeaders(accessToken),
    validateStatus: () => true,
    timeout: 20_000,
  });
  if (upstream.status >= 400) return [];
  return Array.isArray(upstream.data?.content) ? upstream.data.content : [];
}

export async function ingestAutoPrintJobs(account: PrinterAccount) {
  if (!account.settings.autoPrint) return;
  const accessToken = await refreshOwnerAccess(account);
  if (!accessToken) return;

  const status = account.settings.autoPrintOn === "CREATED" ? "Created" : "Accepted";
  const sources = account.settings.sources.filter(
    (source): source is "YEMEK_SEPETI" | "UBER_EATS" => source === "YEMEK_SEPETI" || source === "UBER_EATS",
  );

  for (const source of sources) {
    try {
      const orders = await listIntegrationOrders(accessToken, source, status);
      for (const order of orders) {
        if (!matchesTrigger(order.packageStatus ?? undefined, account.settings.autoPrintOn)) {
          continue;
        }
        enqueuePrintJob(account, {
          source,
          dedupeKey: `${source}:${order.externalOrderId || order.id}`,
          payload: marketplaceOrderToReceipt(order, source),
          copies: account.settings.copies,
          force: false,
        });
      }
    } catch {
      // Keep pending job polling alive even if one marketplace is down.
    }
  }
}

export function sourceEnabled(account: PrinterAccount, source: MarketplacePrintSource): boolean {
  return account.settings.sources.includes(source);
}
