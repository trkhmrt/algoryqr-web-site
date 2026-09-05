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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  areOptionSelectionsValid,
  cartLineKey,
  formatOptionGroupHeading,
  optionDeltaTotal,
  optionKindLabel,
  productHasOptions,
} from "@/lib/product-options";
import {
  createWaiterOrder,
  listWaiterCatalog,
  listWaiterTables,
  WaiterApiError,
  type WaiterCatalogProduct,
  type WaiterTableSummary,
} from "@/lib/waiter-api";

type CartLine = {
  lineKey: string;
  productId: number;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  note: string;
  selectedOptionIds: number[];
  selectedLabels: string[];
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

function optionLabels(product: WaiterCatalogProduct, selectedOptionIds: number[]): string[] {
  const selected = new Set(selectedOptionIds);
  const labels: string[] = [];
  for (const group of product.optionGroups ?? []) {
    for (const option of group.options ?? []) {
      if (selected.has(option.optionId)) labels.push(option.name);
    }
  }
  return labels;
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
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [orderNote, setOrderNote] = useState("");
  const [waiterNote, setWaiterNote] = useState("");
  const [optionsProduct, setOptionsProduct] = useState<WaiterCatalogProduct | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);

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

  function upsertLine(
    product: WaiterCatalogProduct,
    quantity: number,
    optionIds: number[] = [],
  ) {
    if (!product.available) return;
    const key = cartLineKey(product.productId, optionIds);
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[key];
        return next;
      }
      const existing = prev[key];
      const unit =
        productPrice(product) + optionDeltaTotal(product.optionGroups, optionIds);
      next[key] = {
        lineKey: key,
        productId: product.productId,
        name: product.name,
        price: unit,
        currency: product.currency || "TRY",
        quantity,
        note: existing?.note ?? "",
        selectedOptionIds: optionIds,
        selectedLabels: optionLabels(product, optionIds),
      };
      return next;
    });
  }

  function addOrOpenOptions(product: WaiterCatalogProduct) {
    if (!product.available) return;
    if (productHasOptions(product)) {
      setOptionsProduct(product);
      setSelectedOptionIds([]);
      return;
    }
    const key = cartLineKey(product.productId, []);
    const current = cart[key]?.quantity ?? 0;
    upsertLine(product, current + 1, []);
  }

  function submit() {
    if (!selectedTable || lines.length === 0) return;
    createMutation.mutate({
      tableId: selectedTable.tableId,
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        ...(line.note.trim() ? { note: line.note.trim() } : {}),
        ...(line.selectedOptionIds.length
          ? { selectedOptionIds: line.selectedOptionIds }
          : {}),
      })),
      ...(orderNote.trim() ? { note: orderNote.trim() } : {}),
      ...(waiterNote.trim() ? { waiterNote: waiterNote.trim() } : {}),
    });
  }

  const optionsValid = areOptionSelectionsValid(
    optionsProduct?.optionGroups,
    selectedOptionIds,
  );

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

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4">
        {selectedTable == null ? (
          tablesQuery.isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ul className="space-y-2">
              {(tablesQuery.data ?? []).map((table) => (
                <li key={table.tableId}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm"
                    onClick={() => setSelectedTable(table)}
                  >
                    <p className="font-medium">{tableLabel(table)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün ara…"
              />
            </div>

            {categories.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
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
            ) : catalogQuery.isError ? (
              <p className="rounded-lg border border-dashed border-destructive/40 px-4 py-12 text-center text-sm text-destructive">
                {catalogQuery.error instanceof WaiterApiError
                  ? catalogQuery.error.message
                  : "Menü alınamadı."}
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                Ürün bulunamadı.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredProducts.map((product) => {
                  const plainKey = cartLineKey(product.productId, []);
                  const quantity = productHasOptions(product)
                    ? lines
                        .filter((line) => line.productId === product.productId)
                        .reduce((sum, line) => sum + line.quantity, 0)
                    : cart[plainKey]?.quantity ?? 0;
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
                            {productHasOptions(product) ? " · Opsiyonlu" : ""}
                          </p>
                          {hint ? (
                            <p className="text-[11px] text-muted-foreground/90">{hint}</p>
                          ) : null}
                        </div>
                        {productHasOptions(product) ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={!product.available}
                            onClick={() => addOrOpenOptions(product)}
                          >
                            Ekle{quantity > 0 ? ` (${quantity})` : ""}
                          </Button>
                        ) : (
                          <QuantityStepper
                            value={quantity}
                            min={quantity > 0 ? 1 : 0}
                            disabled={!product.available}
                            showDelete={quantity > 0}
                            onChange={(next) => upsertLine(product, next, [])}
                            onRemove={() => upsertLine(product, 0, [])}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {lines.length > 0 ? (
              <div className="space-y-3">
                <ul className="space-y-2 rounded-lg border border-border p-3">
                  {lines.map((line) => (
                    <li key={line.lineKey} className="flex items-start justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {line.quantity}× {line.name}
                        </p>
                        {line.selectedLabels.length ? (
                          <p className="text-xs text-muted-foreground">
                            {line.selectedLabels.join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatMenuPrice(line.price * line.quantity, line.currency)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() =>
                            setCart((prev) => {
                              const next = { ...prev };
                              delete next[line.lineKey];
                              return next;
                            })
                          }
                        >
                          Sil
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
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

      <Dialog
        open={optionsProduct != null}
        onOpenChange={(open) => {
          if (!open) {
            setOptionsProduct(null);
            setSelectedOptionIds([]);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{optionsProduct?.name ?? "Opsiyonlar"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(optionsProduct?.optionGroups ?? []).map((group) => {
              const single = group.maxSelect <= 1;
              return (
                <section key={group.groupId} className="space-y-2">
                  <p className="text-sm font-semibold">
                    {formatOptionGroupHeading(group)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {optionKindLabel(group.kind)}
                      {" · "}
                      {group.minSelect > 0 ? "Zorunlu" : "İsteğe bağlı"}
                    </span>
                  </p>
                  <ul className="space-y-1.5">
                    {(group.options ?? []).map((option) => {
                      const checked = selectedOptionIds.includes(option.optionId);
                      return (
                        <li key={option.optionId}>
                          <button
                            type="button"
                            disabled={!option.available}
                            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm disabled:opacity-40 ${
                              checked ? "border-foreground bg-muted" : "border-border"
                            }`}
                            onClick={() => {
                              const groupIds = new Set(
                                (group.options ?? []).map((item) => item.optionId),
                              );
                              setSelectedOptionIds((prev) => {
                                if (single) {
                                  return [
                                    ...prev.filter((id) => !groupIds.has(id)),
                                    option.optionId,
                                  ];
                                }
                                if (prev.includes(option.optionId)) {
                                  return prev.filter((id) => id !== option.optionId);
                                }
                                const inGroup = prev.filter((id) => groupIds.has(id));
                                if (inGroup.length >= group.maxSelect) return prev;
                                return [...prev, option.optionId];
                              });
                            }}
                          >
                            <span>{option.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {Number(option.priceDelta ?? 0) > 0
                                ? `+${formatMenuPrice(option.priceDelta, optionsProduct?.currency || "TRY")}`
                                : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!optionsValid || !optionsProduct}
              onClick={() => {
                if (!optionsProduct) return;
                const key = cartLineKey(optionsProduct.productId, selectedOptionIds);
                const current = cart[key]?.quantity ?? 0;
                upsertLine(optionsProduct, current + 1, selectedOptionIds);
                setOptionsProduct(null);
                setSelectedOptionIds([]);
              }}
            >
              Sepete ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
