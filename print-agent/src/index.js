#!/usr/bin/env node
/**
 * Restoran PC ajanı. Dashboard'dan eşleme kodu ile bağlanır, kuyruktaki fişleri
 * Birch CV2-UN (ESC/POS) yazıcıya basar.
 *
 * İlk kurulum:
 *   node src/index.js --api https://siteniz --code ABC123
 *
 * Sonra:
 *   node src/index.js
 *
 * LAN varsayılanı tcp://IP:9100 (dashboard ayarı). USB/OS_DRIVER için
 * --printer "Yazici Adi" veya config.json osPrinterName.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(here, "..", "config.json");

const TURKISH = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

function foldAscii(value) {
  return String(value ?? "").replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => TURKISH[char] ?? char);
}

function parseArgs(argv) {
  const out = { api: "", code: "", token: "", printer: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === "--api") out.api = val;
    if (key === "--code") out.code = val;
    if (key === "--token") out.token = val;
    if (key === "--printer") out.printer = val;
  }
  return out;
}

function loadConfig() {
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function formatReceiptText(payload) {
  const lines = [payload.platformLabel, `Siparis: ${payload.orderNumber}`];
  if (payload.createdAt) lines.push(payload.createdAt);
  if (payload.customerName) lines.push(`Musteri: ${payload.customerName}`);
  if (payload.customerPhone) lines.push(`Tel: ${payload.customerPhone}`);
  if (payload.deliveryAddress) lines.push(`Adres: ${payload.deliveryAddress}`);
  if (payload.deliveryType) lines.push(`Teslimat: ${payload.deliveryType}`);
  if (payload.paymentMethod) lines.push(`Odeme: ${payload.paymentMethod}`);
  lines.push("----------------");
  for (const item of payload.items ?? []) {
    lines.push(`${item.quantity}x ${item.name}`);
    if (item.detail) lines.push(`  ${item.detail}`);
  }
  if (payload.note) {
    lines.push("----------------");
    lines.push(`Not: ${payload.note}`);
  }
  if (payload.totalAmount != null) {
    lines.push("----------------");
    lines.push(`Toplam: ${payload.totalAmount} ${payload.currency ?? "TRY"}`);
  }
  return lines.join("\n");
}

function buildEscPos(payload, copies, cut) {
  const ESC = 0x1b;
  const GS = 0x1d;
  const chunks = [];
  const push = (...bytes) => chunks.push(...bytes);
  const text = (value) => {
    const folded = foldAscii(value);
    for (let i = 0; i < folded.length; i += 1) push(folded.charCodeAt(i) & 0xff);
  };
  const line = (value) => {
    text(value);
    push(0x0a);
  };
  const count = Math.min(5, Math.max(1, copies ?? 1));
  for (let copy = 0; copy < count; copy += 1) {
    push(ESC, 0x40);
    push(ESC, 0x61, 1);
    push(ESC, 0x45, 1);
    line(payload.platformLabel || "AlgoryQR");
    push(ESC, 0x45, 0);
    push(ESC, 0x61, 0);
    for (const row of formatReceiptText(payload).split("\n")) line(row);
    push(0x0a, 0x0a);
    if (cut !== false) push(GS, 0x56, 0x00);
  }
  return Buffer.from(chunks);
}

function sendLan(host, port, buffer) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port: Number(port) || 9100 });
    socket.setTimeout(8_000);
    socket.once("error", reject);
    socket.once("timeout", () => reject(new Error("Yazici zaman asimi")));
    socket.once("connect", () => {
      socket.write(buffer, (error) => {
        if (error) reject(error);
        else {
          socket.end();
          resolve();
        }
      });
    });
  });
}

function sendOsPrinter(printerName, buffer) {
  const tmpDir = path.join(os.tmpdir(), "algoryqr-print-agent");
  mkdirSync(tmpDir, { recursive: true });
  const file = path.join(tmpDir, `job-${Date.now()}.bin`);
  writeFileSync(file, buffer);
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let child;
    if (platform === "win32") {
      const name = printerName || "Birch";
      child = spawn("powershell.exe", [
        "-NoProfile",
        "-Command",
        `Get-Content -Encoding Byte -Path '${file.replace(/'/g, "''")}' | Out-Printer -Name '${name.replace(/'/g, "''")}'`,
      ]);
    } else {
      const args = ["-o", "raw"];
      if (printerName) args.push("-d", printerName);
      args.push(file);
      child = spawn("lp", args);
    }
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Yazici komutu ${code} ile cikti`));
    });
  });
}

async function sendToPrinter(settings, buffer, osPrinterName) {
  const type = settings?.connectionType || "LAN";
  if (type === "LAN") {
    const host = settings.lanHost;
    if (!host) throw new Error("LAN IP ayarlanmadi");
    await sendLan(host, settings.lanPort || 9100, buffer);
    return;
  }
  await sendOsPrinter(osPrinterName, buffer);
}

async function apiJson(apiBase, method, pathname, token, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, "")}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
}

const printed = new Set();

async function tick(config) {
  const { jobs, settings } = await apiJson(config.apiBase, "GET", "/api/printer/jobs", config.deviceToken);
  await apiJson(config.apiBase, "POST", "/api/printer/heartbeat", config.deviceToken, {
    connectionType: settings?.connectionType,
    lastError: null,
  });
  for (const job of jobs ?? []) {
    if (printed.has(job.id)) continue;
    try {
      const buffer = buildEscPos(job.payload, job.copies ?? settings?.copies, settings?.cut);
      await sendToPrinter(settings, buffer, config.osPrinterName);
      await apiJson(config.apiBase, "POST", `/api/printer/jobs/${job.id}/ack`, config.deviceToken, {
        status: "PRINTED",
      });
      printed.add(job.id);
      console.log(`Basildi ${job.id} ${job.payload?.orderNumber ?? ""}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await apiJson(config.apiBase, "POST", `/api/printer/jobs/${job.id}/ack`, config.deviceToken, {
        status: "FAILED",
        error: message,
      }).catch(() => undefined);
      await apiJson(config.apiBase, "POST", "/api/printer/heartbeat", config.deviceToken, {
        connectionType: settings?.connectionType,
        lastError: message,
      }).catch(() => undefined);
      console.error(`Basim hatasi ${job.id}: ${message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();
  config.apiBase = args.api || config.apiBase || "";
  config.osPrinterName = args.printer || config.osPrinterName || "";
  if (args.token) config.deviceToken = args.token;

  if (args.code) {
    if (!config.apiBase) {
      console.error("--api site adresi gerekli (ornek: https://qr.algorycode.com)");
      process.exit(1);
    }
    const paired = await apiJson(config.apiBase, "POST", "/api/printer/stations/pair", null, {
      pairingCode: args.code,
    });
    config.deviceToken = paired.deviceToken;
    saveConfig(config);
    console.log("Eslendi. config.json kaydedildi.");
  }

  if (!config.apiBase || !config.deviceToken) {
    console.error("Once esleyin: node src/index.js --api https://siteniz --code KOD");
    process.exit(1);
  }
  saveConfig(config);
  console.log("AlgoryQR print agent calisiyor. Durdurmak icin Ctrl+C.");
  const loop = async () => {
    try {
      await tick(config);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  };
  await loop();
  setInterval(loop, 3000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
