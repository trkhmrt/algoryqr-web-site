import {
  kitchenOrderToReceipt,
  marketplaceOrderToReceipt,
  testReceiptPayload,
  type KitchenLikeOrder,
  type MarketplaceLikeOrder,
} from "@/lib/receipt-ticket";
import { ingestAutoPrintJobs } from "@/lib/server/printer-ingest";
import { ackPrintJob, enqueuePrintJob, pendingJobs } from "@/lib/server/printer-jobs";
import {
  DEFAULT_PRINTER_SETTINGS,
  STATION_ONLINE_MS,
  findAccountByDeviceTokenHash,
  findAccountByPairingCode,
  getAccount,
  hashPrinterToken,
  loadPrinterStore,
  newDeviceToken,
  newPairingCode,
  savePrinterStore,
  type PrinterConnectionType,
  type PrinterSettings,
  type PrintJob,
  type PrinterAccount,
} from "@/lib/server/printer-store";

function withStore<T>(fn: (account: PrinterAccount) => T | Promise<T>, userId: number): Promise<T> {
  const store = loadPrinterStore();
  const account = getAccount(store, userId);
  return Promise.resolve(fn(account)).then((result) => {
    savePrinterStore(store);
    return result;
  });
}

export function publicSettings(account: PrinterAccount) {
  return account.settings;
}

export function publicStation(account: PrinterAccount) {
  const station = account.station;
  if (!station) {
    return { paired: false, online: false, lastHeartbeatAt: null as string | null, lastError: null as string | null };
  }
  const last = station.lastHeartbeatAt ? new Date(station.lastHeartbeatAt).getTime() : 0;
  const online = Boolean(last && Date.now() - last < STATION_ONLINE_MS);
  return {
    paired: true,
    online,
    lastHeartbeatAt: station.lastHeartbeatAt ?? null,
    lastError: station.lastError ?? null,
    connectionType: station.connectionType ?? account.settings.connectionType,
  };
}

export async function getPrinterDashboard(userId: number, tokens?: { accessToken?: string | null; refreshToken?: string | null }) {
  return withStore((account) => {
    if (tokens?.accessToken) account.accessToken = tokens.accessToken;
    if (tokens?.refreshToken) account.refreshToken = tokens.refreshToken;
    return {
      settings: publicSettings(account),
      station: publicStation(account),
      pairingCode: account.pairingCode && account.pairingCode.expiresAt > Date.now() ? account.pairingCode : null,
    };
  }, userId);
}

export async function updatePrinterSettings(
  userId: number,
  patch: Partial<PrinterSettings>,
  tokens?: { accessToken?: string | null; refreshToken?: string | null },
) {
  return withStore((account) => {
    if (tokens?.accessToken) account.accessToken = tokens.accessToken;
    if (tokens?.refreshToken) account.refreshToken = tokens.refreshToken;
    const next: PrinterSettings = {
      ...account.settings,
      ...patch,
      sources: patch.sources ?? account.settings.sources,
    };
    if (next.lanPort < 1 || next.lanPort > 65535) next.lanPort = 9100;
    if (next.copies < 1) next.copies = 1;
    if (next.copies > 5) next.copies = 5;
    account.settings = next;
    return publicSettings(account);
  }, userId);
}

export async function createPrinterPairingCode(
  userId: number,
  tokens?: { accessToken?: string | null; refreshToken?: string | null },
) {
  return withStore((account) => {
    if (tokens?.accessToken) account.accessToken = tokens.accessToken;
    if (tokens?.refreshToken) account.refreshToken = tokens.refreshToken;
    const code = newPairingCode();
    account.pairingCode = { code, expiresAt: Date.now() + 15 * 60 * 1000 };
    return account.pairingCode;
  }, userId);
}

export async function pairPrinterStation(pairingCode: string) {
  const store = loadPrinterStore();
  const account = findAccountByPairingCode(store, pairingCode);
  if (!account) {
    return { error: "Eşleme kodu geçersiz veya süresi doldu", status: 400 as const };
  }
  const deviceToken = newDeviceToken();
  account.station = {
    deviceTokenHash: hashPrinterToken(deviceToken),
    online: true,
    lastHeartbeatAt: new Date().toISOString(),
    connectionType: account.settings.connectionType,
    lastError: null,
  };
  account.pairingCode = null;
  savePrinterStore(store);
  return {
    status: 200 as const,
    deviceToken,
    settings: publicSettings(account),
  };
}

export async function getAccountByDeviceToken(deviceToken: string): Promise<PrinterAccount | null> {
  const store = loadPrinterStore();
  return findAccountByDeviceTokenHash(store, hashPrinterToken(deviceToken));
}

export async function printerHeartbeat(
  deviceToken: string,
  body: { connectionType?: PrinterConnectionType; lastError?: string | null },
) {
  const store = loadPrinterStore();
  const account = findAccountByDeviceTokenHash(store, hashPrinterToken(deviceToken));
  if (!account || !account.station) return { error: "Ajan eşli değil", status: 401 as const };
  account.station.lastHeartbeatAt = new Date().toISOString();
  account.station.online = true;
  account.station.lastError = body.lastError ?? null;
  if (body.connectionType) account.station.connectionType = body.connectionType;
  savePrinterStore(store);
  return { status: 200 as const, settings: publicSettings(account), station: publicStation(account) };
}

export async function listPendingPrinterJobs(deviceToken: string) {
  const store = loadPrinterStore();
  const account = findAccountByDeviceTokenHash(store, hashPrinterToken(deviceToken));
  if (!account) return { error: "Ajan eşli değil", status: 401 as const };
  await ingestAutoPrintJobs(account);
  const jobs = pendingJobs(account);
  savePrinterStore(store);
  return { status: 200 as const, jobs, settings: publicSettings(account) };
}

export async function ackPrinterJob(
  deviceToken: string,
  jobId: string,
  result: { status: "PRINTED" | "FAILED"; error?: string },
) {
  const store = loadPrinterStore();
  const account = findAccountByDeviceTokenHash(store, hashPrinterToken(deviceToken));
  if (!account) return { error: "Ajan eşli değil", status: 401 as const };
  const job = ackPrintJob(account, jobId, result);
  if (!job) return { error: "İş bulunamadı", status: 404 as const };
  savePrinterStore(store);
  return { status: 200 as const, job };
}

export async function createOwnerPrintJob(
  userId: number,
  input:
    | { kind: "marketplace"; source: "YEMEK_SEPETI" | "UBER_EATS"; order: MarketplaceLikeOrder; force?: boolean }
    | { kind: "kitchen"; order: KitchenLikeOrder; force?: boolean }
    | { kind: "test" },
) {
  return withStore((account) => {
    if (input.kind === "test") {
      return enqueuePrintJob(account, {
        source: "TEST",
        dedupeKey: `TEST:${Date.now()}`,
        payload: testReceiptPayload(),
        copies: account.settings.copies,
        force: true,
      });
    }
    if (input.kind === "marketplace") {
      return enqueuePrintJob(account, {
        source: input.source,
        dedupeKey: `${input.source}:${input.order.externalOrderId || input.order.id}`,
        payload: marketplaceOrderToReceipt(input.order, input.source),
        copies: account.settings.copies,
        force: input.force ?? true,
      });
    }
    return enqueuePrintJob(account, {
      source: "QR",
      dedupeKey: `QR:${input.order.id}:${Date.now()}`,
      payload: kitchenOrderToReceipt(input.order),
      copies: account.settings.copies,
      force: true,
    });
  }, userId);
}

export { DEFAULT_PRINTER_SETTINGS };
export type { PrintJob, PrinterSettings };
