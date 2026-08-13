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
  getCart,
  openTableSession,
  putCart,
  submitOrder as submitOrderApi,
  type OrderResponse,
} from "@/lib/ordering-api";

const SESSION_STORAGE_PREFIX = "algory_table_session:";

type LocalCartItem = {
  productId: number;
  productName: string;
  unitPrice?: number | string;
  quantity: number;
  note?: string;
  currency?: string;
};

type OrderingContextValue = {
  identifier: string;
  menuId: number;
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
  addProduct: (product: MenuProductApiItem, quantity?: number) => Promise<void>;
  updateQty: (productId: number, quantity: number) => Promise<void>;
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
  menuId: number;
  children: ReactNode;
};

export function OrderingProvider({ identifier, menuId, children }: OrderingProviderProps) {
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

  const syncLocalFromCart = useCallback((order: OrderResponse | null) => {
    const items = (order?.items ?? []).map((item) => ({
      productId: item.productId,
      productName: item.productName || `#${item.productId}`,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      note: item.note ?? undefined,
      currency: order?.currency ?? undefined,
    }));
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sepet alınamadı");
    }
  }, [identifier, sessionToken, syncLocalFromCart]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        let token: string | null = null;
        let name: string | null = null;
        let reuseStored = false;

        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(sessionStorageKey(identifier));
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as {
                sessionToken?: string;
                tableName?: string;
                tableToken?: string | null;
              };
              // Masa QR değiştiyse eski oturumu kullanma
              if (
                parsed.sessionToken &&
                (parsed.tableToken ?? null) === (tableToken ?? null)
              ) {
                token = parsed.sessionToken;
                name = parsed.tableName ?? null;
                reuseStored = true;
              }
            } catch {
              sessionStorage.removeItem(sessionStorageKey(identifier));
            }
          }
        }

        if (!reuseStored) {
          const session = await openTableSession(identifier, tableToken);
          token = session.sessionToken;
          name = session.tableName;
          persistSession(session);
        }

        if (cancelled) return;
        setSessionToken(token);
        setTableName(name);

        if (token) {
          try {
            const next = await getCart(identifier, token);
            if (!cancelled) {
              setCart(next);
              syncLocalFromCart(next);
            }
          } catch {
            // stale session — yeniden aç
            try {
              const session = await openTableSession(identifier, tableToken);
              if (cancelled) return;
              setSessionToken(session.sessionToken);
              setTableName(session.tableName);
              persistSession(session);
            } catch (err) {
              if (!cancelled) {
                setError(err instanceof Error ? err.message : "Sipariş oturumu açılamadı");
              }
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
    async (product: MenuProductApiItem, quantity = 1) => {
      setError(null);
      let token = sessionToken;
      if (!token) {
        try {
          token = await ensureSession();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sipariş oturumu açılamadı");
          return;
        }
      }

      const existing = localItems.find((item) => item.productId === product.productId);
      const nextItems = existing
        ? localItems.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [
            ...localItems,
            {
              productId: product.productId,
              productName: product.name,
              unitPrice: product.price,
              quantity,
              currency: product.currency,
            },
          ];
      setLocalItems(nextItems);
      try {
        await persistCart(nextItems, note, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sepete eklenemedi");
        await refreshCart();
      }
    },
    [ensureSession, localItems, note, persistCart, refreshCart, sessionToken],
  );

  const updateQty = useCallback(
    async (productId: number, quantity: number) => {
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
          ? localItems.filter((item) => item.productId !== productId)
          : localItems.map((item) =>
              item.productId === productId ? { ...item, quantity } : item,
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
      menuId,
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
      addProduct,
      updateQty,
      submitOrder,
      refreshCart,
      cartOpen,
      setCartOpen,
    }),
    [
      addProduct,
      bootstrapped,
      cart,
      cartCount,
      cartOpen,
      cartTotal,
      error,
      identifier,
      loading,
      localItems,
      menuId,
      note,
      refreshCart,
      sessionToken,
      submitOrder,
      submitting,
      tableName,
      updateQty,
    ],
  );

  return <OrderingContext.Provider value={value}>{children}</OrderingContext.Provider>;
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
