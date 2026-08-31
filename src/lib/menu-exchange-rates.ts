export const MENU_DISPLAY_CURRENCIES = ["TRY", "USD", "EUR", "GBP", "RUB"] as const;

export type MenuDisplayCurrency = (typeof MENU_DISPLAY_CURRENCIES)[number];

export const EXCHANGE_RATE_BASE = "TRY";

const DISPLAY_CURRENCY_SET = new Set<string>(MENU_DISPLAY_CURRENCIES);

export function isMenuDisplayCurrency(value: string): value is MenuDisplayCurrency {
  return DISPLAY_CURRENCY_SET.has(value);
}

export function normalizeCurrency(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (trimmed === "TL") return "TRY";
  return trimmed;
}

export function parseMenuPrice(price?: number | string | null): number | null {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (amount == null || !Number.isFinite(amount)) return null;
  return amount;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: MenuDisplayCurrency,
  rates: Record<string, number>,
  base = EXCHANGE_RATE_BASE,
): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (from === to) return amount;

  let inBase = amount;
  if (from !== base) {
    const fromRate = rates[from];
    if (fromRate == null || fromRate <= 0) return amount;
    inBase = amount / fromRate;
  }

  if (to === base) return inBase;

  const toRate = rates[to];
  if (toRate == null || toRate <= 0) return amount;
  return inBase * toRate;
}

export function formatDisplayPrice(
  amount: number,
  currency: MenuDisplayCurrency,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type ExchangeRatesResponse = {
  base: typeof EXCHANGE_RATE_BASE;
  rates: Record<string, number>;
  fetchedAt: string;
};
