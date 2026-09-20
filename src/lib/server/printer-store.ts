import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { PrintSource, ReceiptPayload } from "@/lib/receipt-ticket";
import {
  DEFAULT_PRINTER_SETTINGS,
  type MarketplacePrintSource,
  type PrintTrigger,
  type PrinterConnectionType,
  type PrinterSettings,
} from "@/lib/printer-types";

export type { MarketplacePrintSource, PrintTrigger, PrinterConnectionType, PrinterSettings };
export { DEFAULT_PRINTER_SETTINGS };

export type PrintJobStatus = "PENDING" | "PRINTED" | "FAILED";

export type PrintJob = {
  id: string;
  userId: number;
  source: PrintSource;
  dedupeKey: string;
  status: PrintJobStatus;
  payload: ReceiptPayload;
  copies: number;
  createdAt: string;
  printedAt?: string;
  error?: string;
};

export type PrinterStationState = {
  deviceTokenHash: string;
  lastHeartbeatAt?: string;
  lastError?: string | null;
  connectionType?: PrinterConnectionType;
  online: boolean;
};

export type PrinterAccount = {
  userId: number;
  settings: PrinterSettings;
  pairingCode?: { code: string; expiresAt: number } | null;
  station?: PrinterStationState | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  printedKeys: string[];
  jobs: PrintJob[];
};

export type PrinterStoreFile = {
  accounts: Record<string, PrinterAccount>;
};

export const STATION_ONLINE_MS = 20_000;

function storePath(): string {
  return process.env.PRINTER_STORE_PATH?.trim() || path.join(process.cwd(), ".data", "printer-store.json");
}

function emptyStore(): PrinterStoreFile {
  return { accounts: {} };
}

export function loadPrinterStore(): PrinterStoreFile {
  try {
    const raw = readFileSync(storePath(), "utf8");
    const parsed = JSON.parse(raw) as PrinterStoreFile;
    if (!parsed || typeof parsed !== "object" || !parsed.accounts) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function savePrinterStore(store: PrinterStoreFile) {
  const file = storePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2), "utf8");
}

export function hashPrinterToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newPrinterJobId(): string {
  return randomBytes(12).toString("hex");
}

export function newDeviceToken(): string {
  return `aqrprt_${randomBytes(24).toString("hex")}`;
}

export function newPairingCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

export function getAccount(store: PrinterStoreFile, userId: number): PrinterAccount {
  const key = String(userId);
  const existing = store.accounts[key];
  if (existing) return existing;
  const created: PrinterAccount = {
    userId,
    settings: { ...DEFAULT_PRINTER_SETTINGS, sources: [...DEFAULT_PRINTER_SETTINGS.sources] },
    pairingCode: null,
    station: null,
    printedKeys: [],
    jobs: [],
  };
  store.accounts[key] = created;
  return created;
}

export function findAccountByDeviceTokenHash(
  store: PrinterStoreFile,
  tokenHash: string,
): PrinterAccount | null {
  for (const account of Object.values(store.accounts)) {
    if (account.station?.deviceTokenHash === tokenHash) return account;
  }
  return null;
}

export function findAccountByPairingCode(store: PrinterStoreFile, code: string): PrinterAccount | null {
  const normalized = code.trim().toUpperCase();
  const now = Date.now();
  for (const account of Object.values(store.accounts)) {
    if (!account.pairingCode) continue;
    if (account.pairingCode.code === normalized && account.pairingCode.expiresAt > now) {
      return account;
    }
  }
  return null;
}
