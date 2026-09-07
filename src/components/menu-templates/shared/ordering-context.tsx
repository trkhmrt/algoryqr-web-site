"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

import type { MenuProductApiItem } from "@/lib/api";
import {
  cartLineKey,
  productHasOptions,
  selectedOptionIdsFromSnapshot,
  type SelectedOrderOption,
} from "@/lib/product-options";
import {
  getCart,
  openTableSession,
  OrderingApiError,
  putCart,
  submitOrder as submitOrderApi,
  type OrderResponse,
} from "@/lib/ordering-api";

import { ProductOptionsSheet } from "./ProductOptionsSheet";

const SESSION_STORAGE_PREFIX = "algory_table_session:";

type LocalCartItem = {
  lineKey: string;
  productId: number;
  productName: string;
  unitPrice?: number | string;
  quantity: number;
  note?: string;
  currency?: string;
  selectedOptionIds: number[];
  selectedOptions?: SelectedOrderOption[];
};

type OrderingContextValue = {
  identifier: string;
  publicId: string;
  hasTableSession: boolean;
  tableName: string | null;
  sessionToken: string | null;
  cart: OrderResponse | null;
  localItems: LocalCartItem[];
  cartCount: number;
  cartTotal: number;
  note: string;
  setNote: (note: string) => void;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  beginAddProduct: (product: MenuProductApiItem, quantity?: number) => Promise<string | null>;
  addProduct: (
    product: MenuProductApiItem,
    quantity?: number,
    selectedOptionIds?: number[],
    lineNote?: string,
  ) => Promise<string | null>;
  updateQty: (lineKey: string, quantity: number) => Promise<void>;
  submitOrder: () => Promise<OrderResponse | null>;
  refreshCart: () => Promise<void>;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
};

const OrderingContext = createContext<OrderingContextValue | null>(null);

function sessionStorageKey(identifier: string) {
  return `${SESSION_STORAGE_PREFIX}${identifier}`;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type OrderingProviderProps = {
  identifier: string;
  publicId: string;
  children: ReactNode;
};

export function OrderingProvider({ identifier, publicId, children }: OrderingProviderProps) {
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t")?.trim() || null;

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderResponse | null>(null);
  const [localItems, setLocalItems] = useState<LocalCartItem[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<MenuProductApiItem | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const syncLocalFromCart = useCallback((order: OrderResponse | null) => {
    const items = (order?.items ?? []).map((item) => {
      const selectedOptions = item.selectedOptions ?? [];
      const selectedOptionIds = selectedOptionIdsFromSnapshot(selectedOptions);
      return {
        lineKey: cartLineKey(item.productId, selectedOptionIds),
        productId: item.productId,
        productName: item.productName || `#${item.productId}`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        note: item.note ?? undefined,
        currency: order?.currency ?? undefined,
        selectedOptionIds,
        selectedOptions,
      };
    });
    setLocalItems(items);
    setNote(order?.note ?? "");
  }, []);

  const persistSession = useCallback(
    (session: { sessionToken: string; tableName?: string | null; tableId?: number; expiresAt?: string | null }) => {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(
        sessionStorageKey(identifier),
        JSON.stringify({
          sessionToken: session.sessionToken,
          tableName: session.tableName,
          tableId: session.tableId,
          expiresAt: session.expiresAt,
          tableToken: tableToken,
        }),
      );
    },
    [identifier, tableToken],
  );

  const ensureSession = useCallback(async () => {
    const session = await openTableSession(identifier, tableToken);
    setSessionToken(session.sessionToken);
    setTableName(session.tableName);
    persistSession(session);
    return session.sessionToken;
  }, [identifier, persistSession, tableToken]);

  const refreshCart = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const next = await getCart(identifier, sessionToken);
      setCart(next);
      syncLocalFromCart(next);
    } catch {
      /* ignore */
    }
  }, [identifier, sessionToken, syncLocalFromCart]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem(sessionStorageKey(identifier));
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as {
                sessionToken?: string;
                tableName?: string;
                tableToken?: string | null;
              };
              if (
                parsed.sessionToken &&
                (!tableToken || !parsed.tableToken || parsed.tableToken === tableToken)
              ) {
                setSessionToken(parsed.sessionToken);
                setTableName(parsed.tableName ?? null);
                const next = await getCart(identifier, parsed.sessionToken);
                if (!cancelled) {
                  setCart(next);
                  syncLocalFromCart(next);
                }
                if (!cancelled) {
                  setLoading(false);
                  setBootstrapped(true);
                }
                return;
              }
            } catch {
              sessionStorage.removeItem(sessionStorageKey(identifier));
            }
          }
        }

        if (tableToken) {
          try {
            const session = await openTableSession(identifier, tableToken);
            if (cancelled) return;
            setSessionToken(session.sessionToken);
            setTableName(session.tableName);
            persistSession(session);
            const next = await getCart(identifier, session.sessionToken);
            if (!cancelled) {
              setCart(next);
              syncLocalFromCart(next);
            }
          } catch (err) {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : "Sipariş oturumu açılamadı");
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Sipariş oturumu açılamadı");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [identifier, persistSession, syncLocalFromCart, tableToken]);

  const persistCart = useCallback(
    async (items: LocalCartItem[], nextNote: string, token: string) => {
      const payload = {
        items: items
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            ...(item.note ? { note: item.note } : {}),
            ...(item.selectedOptionIds.length
              ? { selectedOptionIds: item.selectedOptionIds }
              : {}),
          })),
        ...(nextNote.trim() ? { note: nextNote.trim() } : {}),
      };
      const next = await putCart(identifier, token, payload);
      setCart(next);
      syncLocalFromCart(next);
      return next;
    },
    [identifier, syncLocalFromCart],
  );

  const addProduct = useCallback(
    async (
      product: MenuProductApiItem,
      quantity = 1,
      selectedOptionIds: number[] = [],
      lineNote?: string,
    ): Promise<string | null> => {
      setError(null);
      if (!Number.isFinite(product.productId) || product.productId <= 0) {
        const message = "Ürün bilgisi eksik";
        setError(message);
        return message;
      }

      let token = sessionToken;
      if (!token) {
        try {
          token = await ensureSession();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sipariş oturumu açılamadı";
          setError(message);
          return message;
        }
      }

      const key = cartLineKey(product.productId, selectedOptionIds);
      const existing = localItems.find((item) => item.lineKey === key);
      const nextItems = existing
        ? localItems.map((item) =>
            item.lineKey === key
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  ...(lineNote ? { note: lineNote } : {}),
                }
              : item,
          )
        : [
            ...localItems,
            {
              lineKey: key,
              productId: product.productId,
              productName: product.name,
              unitPrice: product.price,
              quantity,
              currency: product.currency,
              selectedOptionIds,
              note: lineNote,
            },
          ];

      const persistWithToken = async (activeToken: string) => {
        await persistCart(nextItems, note, activeToken);
      };

      try {
        await persistWithToken(token);
        return null;
      } catch (err) {
        const expired =
          err instanceof OrderingApiError && (err.status === 401 || err.status === 403);
        if (expired) {
          try {
            token = await ensureSession();
            await persistWithToken(token);
            return null;
          } catch (retryErr) {
            const message =
              retryErr instanceof Error ? retryErr.message : "Sepete eklenemedi";
            setError(message);
            await refreshCart();
            return message;
          }
        }
        const message = err instanceof Error ? err.message : "Sepete eklenemedi";
        setError(message);
        await refreshCart();
        return message;
      }
    },
    [ensureSession, localItems, note, persistCart, refreshCart, sessionToken],
  );

  const beginAddProduct = useCallback(
    async (product: MenuProductApiItem, quantity = 1): Promise<string | null> => {
      if (productHasOptions(product)) {
        setOptionsProduct(product);
        setOptionsOpen(true);
        return null;
      }
      const failure = await addProduct(product, quantity);
      if (!failure) setCartOpen(true);
      return failure;
    },
    [addProduct],
  );

  const updateQty = useCallback(
    async (lineKey: string, quantity: number) => {
      let token = sessionToken;
      if (!token) {
        try {
          token = await ensureSession();
        } catch {
          return;
        }
      }
      const nextItems =
        quantity <= 0
          ? localItems.filter((item) => item.lineKey !== lineKey)
          : localItems.map((item) =>
              item.lineKey === lineKey ? { ...item, quantity } : item,
            );
      setLocalItems(nextItems);
      try {
        await persistCart(nextItems, note, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sepet güncellenemedi");
        await refreshCart();
      }
    },
    [ensureSession, localItems, note, persistCart, refreshCart, sessionToken],
  );

  const submitOrder = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      let token = sessionToken;
      if (!token) {
        token = await ensureSession();
      }
      if (localItems.length > 0) {
        await persistCart(localItems, note, token);
      }
      const order = await submitOrderApi(identifier, token);
      setCart(null);
      setLocalItems([]);
      setNote("");
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş gönderilemedi");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [ensureSession, identifier, localItems, note, persistCart, sessionToken]);

  const cartCount = useMemo(
    () => localItems.reduce((sum, item) => sum + item.quantity, 0),
    [localItems],
  );

  const cartTotal = useMemo(() => {
    if (cart?.totalAmount != null) return toNumber(cart.totalAmount);
    return localItems.reduce(
      (sum, item) => sum + toNumber(item.unitPrice) * item.quantity,
      0,
    );
  }, [cart?.totalAmount, localItems]);

  const value = useMemo<OrderingContextValue>(
    () => ({
      identifier,
      publicId,
      hasTableSession: Boolean(sessionToken) && bootstrapped,
      tableName,
      sessionToken,
      cart,
      localItems,
      cartCount,
      cartTotal,
      note,
      setNote,
      loading,
      submitting,
      error,
      beginAddProduct,
      addProduct,
      updateQty,
      submitOrder,
      refreshCart,
      cartOpen,
      setCartOpen,
    }),
    [
      addProduct,
      beginAddProduct,
      bootstrapped,
      cart,
      cartCount,
      cartOpen,
      cartTotal,
      error,
      identifier,
      loading,
      localItems,
      publicId,
      note,
      refreshCart,
      sessionToken,
      submitOrder,
      submitting,
      tableName,
      updateQty,
    ],
  );

  return (
    <OrderingContext.Provider value={value}>
      {children}
      <ProductOptionsSheet
        product={optionsProduct}
        open={optionsOpen}
        onOpenChange={(open) => {
          setOptionsOpen(open);
          if (!open) setOptionsProduct(null);
        }}
        onConfirm={async ({ selectedOptionIds, quantity, note: lineNote }) => {
          if (!optionsProduct) return "Ürün bulunamadı";
          const failure = await addProduct(
            optionsProduct,
            quantity,
            selectedOptionIds,
            lineNote,
          );
          if (!failure) setCartOpen(true);
          return failure;
        }}
      />
    </OrderingContext.Provider>
  );
}

export function useOrdering(): OrderingContextValue {
  const ctx = useContext(OrderingContext);
  if (!ctx) {
    throw new Error("useOrdering must be used within OrderingProvider");
  }
  return ctx;
}

export function useOrderingOptional(): OrderingContextValue | null {
  return useContext(OrderingContext);
}
