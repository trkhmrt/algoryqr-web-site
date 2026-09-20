import { api } from "@/lib/api/client";
import type { KitchenLikeOrder, MarketplaceLikeOrder, ReceiptPayload } from "@/lib/receipt-ticket";
import type { PrinterSettings } from "@/lib/printer-types";

export type PrinterStationView = {
  paired: boolean;
  online: boolean;
  lastHeartbeatAt: string | null;
  lastError: string | null;
  connectionType?: PrinterSettings["connectionType"];
};

export type PrinterDashboard = {
  settings: PrinterSettings;
  station: PrinterStationView;
  pairingCode: { code: string; expiresAt: number } | null;
};

export type PrinterJob = {
  id: string;
  source: string;
  status: string;
  payload: ReceiptPayload;
  copies: number;
  createdAt: string;
};

export async function getPrinterDashboard() {
  const { data } = await api.get<PrinterDashboard>("/printer/settings");
  return data;
}

export async function updatePrinterSettings(payload: Partial<PrinterSettings>) {
  const { data } = await api.put<PrinterSettings>("/printer/settings", payload);
  return data;
}

export async function createPrinterPairingCode() {
  const { data } = await api.post<{ code: string; expiresAt: number }>("/printer/stations/pairing-code", {});
  return data;
}

export async function createTestPrintJob() {
  const { data } = await api.post<PrinterJob>("/printer/jobs/test", {});
  return data;
}

export async function enqueueMarketplacePrintJob(
  source: "YEMEK_SEPETI" | "UBER_EATS",
  order: MarketplaceLikeOrder,
) {
  const { data } = await api.post<PrinterJob>("/printer/jobs", {
    kind: "marketplace",
    source,
    order,
  });
  return data;
}

export async function enqueueKitchenPrintJob(order: KitchenLikeOrder) {
  const { data } = await api.post<PrinterJob>("/printer/jobs", {
    kind: "kitchen",
    order,
  });
  return data;
}
