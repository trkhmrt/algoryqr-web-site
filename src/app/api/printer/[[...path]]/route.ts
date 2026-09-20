import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { readAccessTokenFromCookies, readRefreshTokenFromCookies } from "@/lib/server/auth-cookies";
import {
  ackPrinterJob,
  createOwnerPrintJob,
  createPrinterPairingCode,
  getPrinterDashboard,
  listPendingPrinterJobs,
  pairPrinterStation,
  printerHeartbeat,
  updatePrinterSettings,
} from "@/lib/server/printer-service";
import type { PrinterSettings } from "@/lib/server/printer-store";

type RouteContext = { params: Promise<{ path?: string[] }> };

function readBearer(req: Request): string | null {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token?.startsWith("aqrprt_")) return null;
  return token;
}

async function ownerContext() {
  const cookieStore = await cookies();
  const accessToken = readAccessTokenFromCookies(cookieStore);
  if (!accessToken) return null;
  const userId = getUserIdFromAccessToken(accessToken);
  if (userId == null) return null;
  return {
    userId,
    accessToken,
    refreshToken: readRefreshTokenFromCookies(cookieStore),
  };
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { __invalid: true };
  }
}

export async function GET(req: Request, context: RouteContext) {
  const path = (await context.params).path ?? [];
  const joined = path.join("/");
  const deviceToken = readBearer(req);

  if (joined === "jobs" && deviceToken) {
    const result = await listPendingPrinterJobs(deviceToken);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json({ jobs: result.jobs, settings: result.settings });
  }

  if (joined === "settings" && deviceToken) {
    const result = await listPendingPrinterJobs(deviceToken);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json(result.settings);
  }

  const owner = await ownerContext();
  if (!owner) return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });

  if (joined === "settings" || joined === "" || joined === "station") {
    const data = await getPrinterDashboard(owner.userId, owner);
    return NextResponse.json(data);
  }

  return NextResponse.json({ message: "Bulunamadı" }, { status: 404 });
}

export async function PUT(req: Request, context: RouteContext) {
  const path = (await context.params).path ?? [];
  const joined = path.join("/");
  const owner = await ownerContext();
  if (!owner) return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
  if (joined !== "settings") return NextResponse.json({ message: "Bulunamadı" }, { status: 404 });
  const body = await readJson(req);
  if (body.__invalid) return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });
  const settings = await updatePrinterSettings(owner.userId, body as Partial<PrinterSettings>, owner);
  return NextResponse.json(settings);
}

export async function POST(req: Request, context: RouteContext) {
  const path = (await context.params).path ?? [];
  const joined = path.join("/");
  const body = await readJson(req);
  if (body.__invalid) return NextResponse.json({ message: "Geçersiz JSON" }, { status: 400 });

  if (joined === "stations/pair") {
    const code = typeof body.pairingCode === "string" ? body.pairingCode : "";
    const result = await pairPrinterStation(code);
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json({ deviceToken: result.deviceToken, settings: result.settings });
  }

  const deviceToken = readBearer(req);
  if (joined === "heartbeat" && deviceToken) {
    const result = await printerHeartbeat(deviceToken, {
      connectionType: body.connectionType as PrinterSettings["connectionType"] | undefined,
      lastError: typeof body.lastError === "string" ? body.lastError : null,
    });
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json(result);
  }

  if (path[0] === "jobs" && path[2] === "ack" && path[1] && deviceToken) {
    const status = body.status === "FAILED" ? "FAILED" : "PRINTED";
    const result = await ackPrinterJob(deviceToken, path[1], {
      status,
      error: typeof body.error === "string" ? body.error : undefined,
    });
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json(result.job);
  }

  const owner = await ownerContext();
  if (!owner) return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });

  if (joined === "stations/pairing-code") {
    const pairing = await createPrinterPairingCode(owner.userId, owner);
    return NextResponse.json(pairing);
  }

  if (joined === "jobs/test") {
    const job = await createOwnerPrintJob(owner.userId, { kind: "test" });
    return NextResponse.json(job);
  }

  if (joined === "jobs") {
    const kind = body.kind;
    if (kind === "marketplace") {
      const source = body.source === "UBER_EATS" ? "UBER_EATS" : "YEMEK_SEPETI";
      const job = await createOwnerPrintJob(owner.userId, {
        kind: "marketplace",
        source,
        order: body.order as never,
        force: true,
      });
      return NextResponse.json(job);
    }
    if (kind === "kitchen") {
      const job = await createOwnerPrintJob(owner.userId, {
        kind: "kitchen",
        order: body.order as never,
        force: true,
      });
      return NextResponse.json(job);
    }
    return NextResponse.json({ message: "Geçersiz iş" }, { status: 400 });
  }

  return NextResponse.json({ message: "Bulunamadı" }, { status: 404 });
}
