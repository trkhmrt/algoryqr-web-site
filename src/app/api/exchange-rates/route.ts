import { NextResponse } from "next/server";

import {
  EXCHANGE_RATE_BASE,
  type ExchangeRatesResponse,
} from "@/lib/menu-exchange-rates";

const REVALIDATE_SECONDS = 600;

type ExchangeRateApiPayload = {
  result?: string;
  base_code?: string;
  conversion_rates?: Record<string, number>;
  time_last_update_unix?: number;
};

export async function GET() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ message: "Exchange rate service unavailable" }, { status: 503 });
  }

  try {
    const upstream = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${EXCHANGE_RATE_BASE}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );

    if (!upstream.ok) {
      return NextResponse.json({ message: "Exchange rate fetch failed" }, { status: 502 });
    }

    const payload = (await upstream.json()) as ExchangeRateApiPayload;
    if (payload.result !== "success" || !payload.conversion_rates) {
      return NextResponse.json({ message: "Exchange rate payload invalid" }, { status: 502 });
    }

    const fetchedAt = payload.time_last_update_unix
      ? new Date(payload.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString();

    const body: ExchangeRatesResponse = {
      base: EXCHANGE_RATE_BASE,
      rates: payload.conversion_rates,
      fetchedAt,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Exchange rate fetch failed" }, { status: 502 });
  }
}
