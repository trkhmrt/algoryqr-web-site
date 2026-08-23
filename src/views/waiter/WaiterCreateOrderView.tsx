"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Search } from "lucide-react";

import { formatMenuPrice } from "@/components/menu-templates/types";
import { QuantityStepper } from "@/components/waiter/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createWaiterOrder,
  listWaiterCatalog,
  listWaiterTables,
  WaiterApiError,
  type WaiterCatalogProduct,
  type WaiterTableSummary,
} from "@/lib/waiter-api";

type CartLine = {
  productId: number;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  note: string;
};

function commissionValueNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function productPrice(product: WaiterCatalogProduct): number {
  const raw = product.price;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function commissionHint(
  product: WaiterCatalogProduct,
  commissionEnabled?: boolean,
  commissionType?: "PERCENT" | "FIXED" | null,
  commissionValue?: number | string | null,
): string | null {
  if (!commissionEnabled || commissionType !== "FIXED") return null;
  const amount = commissionValueNumber(commissionValue);
  if (amount == null || amount <= 0) return null;
  if (product.commissionEligible === false) return "Komisyonsuz";
  return `+${formatMenuPrice(amount, product.currency || "TRY")} komisyon`;
}

function tableLabel(table: WaiterTableSummary): string {
  return table.tableName || `Masa ${table.tableNumber ?? table.tableId}`;
}

export default function WaiterCreateOrderView({
  initialTable,
  onClose,
  onCreated,
}: {
  initialTable?: WaiterTableSummary | null;
  onClose: () => void;
  onCreated: (table?: WaiterTableSummary | null) => void;
}) {
  const [selectedTable, setSelectedTable] = useState<WaiterTableSummary | null>(initialTable ?? null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [orderNote, setOrderNote] = useState("");
  const [waiterNote, setWaiterNote] = useState("");

  const tablesQuery = useQuery({
    queryKey: ["waiter-orders-tables"],
    queryFn: listWaiterTables,
    enabled: selectedTable == null,
  });

  const catalogQuery = useQuery({
    queryKey: ["waiter-order-catalog", selectedTable?.tableId],
    enabled: selectedTable != null,
    queryFn: () => listWaiterCatalog(selectedTable!.tableId),
  });

  const createMutation = useMutation({
    mutationFn: createWaiterOrder,
    onSuccess: () => onCreated(selectedTable),
  });

  const catalog = catalogQuery.data;
  const products = catalog?.products ?? [];
  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const product of products) {
      const name = product.subCategoryName?.trim() || product.mainCategoryName?.trim();
      if (name) names.add(name);
    }
    return Array.from(names);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    return products.filter((product) => {
      const categoryName = product.subCategoryName?.trim() || product.mainCategoryName?.trim() || "Genel";
      if (category !== "all" && categoryName !== category) return false;
      if (!needle) return true;
      return (
        product.name.toLocaleLowerCase("tr").includes(needle) ||
        (product.description ?? "").toLocaleLowerCase("tr").includes(needle)
      );
    });
  }, [products, query, category]);

  const lines = Object.values(cart).filter((line) => line.quantity > 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const currency = lines[0]?.currency || "TRY";

  function setQuantity(product: WaiterCatalogProduct, quantity: number) {
    if (!product.available) return;
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[product.productId];
        return next;
      }
      const existing = prev[product.productId];
      next[product.productId] = {
        productId: product.productId,
        name: product.name,
        price: productPrice(product),
        currency: product.currency || "TRY",
        quantity,
        note: existing?.note ?? "",
      };
      return next;
    });
  }

  function submit() {
    if (!selectedTable || lines.length === 0) return;
    createMutation.mutate({
      tableId: selectedTable.tableId,
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        ...(line.note.trim() ? { note: line.note.trim() } : {}),
      })),
      ...(orderNote.trim() ? { note: orderNote.trim() } : {}),
      ...(waiterNote.trim() ? { waiterNote: waiterNote.trim() } : {}),
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="Geri"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">Yeni sipariş</h1>
            <p className="text-xs text-muted-foreground">
              {selectedTable ? tableLabel(selectedTable) : "Masa seçin"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4 pb-36">
        {createMutation.isError ? (
          <p className="text-sm text-destructive">
            {createMutation.error instanceof WaiterApiError
              ? createMutation.error.message
              : "Sipariş oluşturulamadı."}
          </p>
        ) : null}

        {selectedTable == null ? (
          tablesQuery.isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (tablesQuery.data ?? []).filter((table) => table.active).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Aktif masa bulunamadı.
            </p>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Masa seç</h2>
              {(tablesQuery.data ?? [])
                .filter((table) => table.active)
                .map((table) => (
                  <button
                    key={table.tableId}
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm hover:bg-muted/40"
                  >
                    <span className="font-medium">{tableLabel(table)}</span>
                    {table.pendingOrderCount > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {table.pendingOrderCount} bekleyen
                      </span>
                    ) : null}
                  </button>
                ))}
            </div>
          )
        ) : (
          <>
            {initialTable == null ? (
              <button
                type="button"
                className="text-sm text-muted-foreground"
                onClick={() => setSelectedTable(null)}
              >
                Masayı değiştir
              </button>
            ) : null}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün ara…"
                className="pl-9"
              />
            </div>

            {categories.length > 0 ? (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <CategoryChip
                  label="Tümü"
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                />
                {categories.map((name) => (
                  <CategoryChip
                    key={name}
                    label={name}
                    active={category === name}
                    onClick={() => setCategory(name)}
                  />
                ))}
              </div>
            ) : null}

            {catalogQuery.isLoading ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                Ürün bulunamadı.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredProducts.map((product) => {
                  const quantity = cart[product.productId]?.quantity ?? 0;
                  const hint = commissionHint(
                    product,
                    catalog?.commissionEnabled,
                    catalog?.commissionType,
                    catalog?.commissionValue,
                  );
                  return (
                    <li
                      key={product.productId}
                      className="rounded-lg border border-border bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`font-medium ${product.available ? "" : "text-muted-foreground"}`}>
                            {product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatMenuPrice(product.price ?? undefined, product.currency || "TRY")}
                            {!product.available ? " · Kapalı" : ""}
                          </p>
                          {hint ? (
                            <p className="text-[11px] text-muted-foreground/90">{hint}</p>
                          ) : null}
                        </div>
                        <QuantityStepper
                          value={quantity}
                          min={quantity > 0 ? 1 : 0}
                          disabled={!product.available}
                          showDelete={quantity > 0}
                          onChange={(next) => setQuantity(product, next)}
                          onRemove={() => setQuantity(product, 0)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {lines.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="order-note">
                  Sipariş notu
                </label>
                <Textarea
                  id="order-note"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Müşteri isteği…"
                  rows={2}
                />
                <label className="text-xs font-medium text-muted-foreground" htmlFor="waiter-note">
                  Garson notu
                </label>
                <Textarea
                  id="waiter-note"
                  value={waiterNote}
                  onChange={(e) => setWaiterNote(e.target.value)}
                  placeholder="Mutfak için not…"
                  rows={2}
                />
              </div>
            ) : null}
          </>
        )}
      </main>

      {selectedTable ? (
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {itemCount > 0 ? `${itemCount} ürün` : "Sepet boş"}
            </span>
            <span className="font-semibold">{formatMenuPrice(total, currency)}</span>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base"
            disabled={lines.length === 0 || createMutation.isPending}
            onClick={submit}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Siparişi oluştur"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
        active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
