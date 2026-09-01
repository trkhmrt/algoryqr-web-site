"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  convertAmount,
  formatDisplayPrice,
  isMenuDisplayCurrency,
  normalizeCurrency,
  parseMenuPrice,
  type ExchangeRatesResponse,
  type MenuDisplayCurrency,
} from "@/lib/menu-exchange-rates";

import { useMenuLocale, useMenuLocaleOptional } from "./menu-locale";

const STORAGE_KEY = "algory_menu_currency";

type MenuCurrencyContextValue = {
  displayCurrency: MenuDisplayCurrency;
  setDisplayCurrency: (currency: MenuDisplayCurrency) => void;
  rates: Record<string, number> | null;
  ratesLoading: boolean;
  ensureRates: () => Promise<void>;
};

const MenuCurrencyContext = createContext<MenuCurrencyContextValue | null>(null);

function formatPriceWithRates(
  price: number | string | null | undefined,
  sourceCurrency: string,
  displayCurrency: MenuDisplayCurrency,
  rates: Record<string, number> | null,
  locale: string,
): string {
  const amount = parseMenuPrice(price);
  if (amount == null) return "";

  const from = normalizeCurrency(sourceCurrency);
  const to = normalizeCurrency(displayCurrency);

  if (from === to || !isMenuDisplayCurrency(to)) {
    return formatDisplayPrice(amount, isMenuDisplayCurrency(from) ? from : "TRY", locale);
  }

  if (!rates) {
    return formatDisplayPrice(amount, isMenuDisplayCurrency(from) ? from : "TRY", locale);
  }

  const converted = convertAmount(amount, from, to, rates);
  return formatDisplayPrice(converted, to, locale);
}

type MenuCurrencyProviderProps = {
  children: ReactNode;
  scopeKey?: string;
  defaultCurrency?: MenuDisplayCurrency;
};

function currencyStorageKey(scopeKey?: string): string {
  return scopeKey ? `${STORAGE_KEY}:${scopeKey}` : STORAGE_KEY;
}

export function MenuCurrencyProvider({
  children,
  scopeKey,
  defaultCurrency = "TRY",
}: MenuCurrencyProviderProps) {
  const [displayCurrency, setDisplayCurrencyState] = useState<MenuDisplayCurrency>(defaultCurrency);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(currencyStorageKey(scopeKey));
      if (stored && isMenuDisplayCurrency(stored)) {
        setDisplayCurrencyState(stored);
        return;
      }
      if (defaultCurrency) {
        setDisplayCurrencyState(defaultCurrency);
      }
    } catch {
      /* ignore */
    }
  }, [defaultCurrency, scopeKey]);

  const setDisplayCurrency = useCallback(
    (currency: MenuDisplayCurrency) => {
      setDisplayCurrencyState(currency);
      try {
        window.localStorage.setItem(currencyStorageKey(scopeKey), currency);
      } catch {
        /* ignore */
      }
    },
    [scopeKey],
  );

  const ensureRates = useCallback(async () => {
    if (rates != null) return;
    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    fetchPromiseRef.current = (async () => {
      setRatesLoading(true);
      try {
        const response = await fetch("/api/exchange-rates");
        if (!response.ok) return;
        const payload = (await response.json()) as ExchangeRatesResponse;
        if (!payload.rates) return;
        setRates(payload.rates);
      } catch {
        /* ignore */
      } finally {
        setRatesLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    await fetchPromiseRef.current;
  }, [rates]);

  useEffect(() => {
    if (displayCurrency === "TRY") return;
    void ensureRates();
  }, [displayCurrency, ensureRates]);

  const value = useMemo<MenuCurrencyContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rates,
      ratesLoading,
      ensureRates,
    }),
    [displayCurrency, setDisplayCurrency, rates, ratesLoading, ensureRates],
  );

  return <MenuCurrencyContext.Provider value={value}>{children}</MenuCurrencyContext.Provider>;
}

export function useMenuCurrency(): MenuCurrencyContextValue {
  const ctx = useContext(MenuCurrencyContext);
  if (!ctx) {
    throw new Error("useMenuCurrency must be used within MenuCurrencyProvider");
  }
  return ctx;
}

export function useMenuCurrencyOptional(): MenuCurrencyContextValue | null {
  return useContext(MenuCurrencyContext);
}

export function useMenuPriceDisplay(
  price?: number | string | null,
  sourceCurrency = "TRY",
): string {
  const { displayCurrency, rates } = useMenuCurrency();
  const { locale } = useMenuLocale();

  return useMemo(
    () => formatPriceWithRates(price, sourceCurrency, displayCurrency, rates, locale),
    [price, sourceCurrency, displayCurrency, rates, locale],
  );
}

export function useMenuPriceDisplayOptional(
  price?: number | string | null,
  sourceCurrency = "TRY",
): string {
  const currencyCtx = useMenuCurrencyOptional();
  const localeCtx = useMenuLocaleOptional();
  const locale = localeCtx?.locale ?? "tr";
  const displayCurrency = currencyCtx?.displayCurrency ?? "TRY";
  const rates = currencyCtx?.rates ?? null;

  return useMemo(
    () => formatPriceWithRates(price, sourceCurrency, displayCurrency, rates, locale),
    [price, sourceCurrency, displayCurrency, rates, locale],
  );
}

type MenuPriceTextProps = {
  price?: number | string | null;
  currency?: string;
  className?: string;
};

export function MenuPriceText({ price, currency = "TRY", className }: MenuPriceTextProps) {
  const label = useMenuPriceDisplay(price, currency);
  if (!label) return null;
  return <span className={className}>{label}</span>;
}
