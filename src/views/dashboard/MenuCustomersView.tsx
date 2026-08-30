"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import { listBusinessCustomers, type MenuCustomerItem } from "@/lib/waiter-api";
import { cn } from "@/lib/utils";

const ALL_MENUS = "all";

type SortKey = "name" | "email" | "menu" | "date";
type SortDir = "asc" | "desc";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function customerName(item: MenuCustomerItem): string {
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ").trim();
  return name || "—";
}

function menuLabel(item: MenuCustomerItem): string {
  const name = item.menuName?.trim() || (item.menuId != null ? `Menü #${item.menuId}` : "—");
  return item.menuDeleted ? `${name} (silindi)` : name;
}

function matchesSearch(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLocaleLowerCase("tr").includes(query);
}

function dateValue(item: MenuCustomerItem): number {
  const raw = item.memberSince || item.joinedAt;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function compareRows(
  a: MenuCustomerItem,
  b: MenuCustomerItem,
  key: SortKey,
  dir: SortDir,
): number {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "date") {
    return (dateValue(a) - dateValue(b)) * mul;
  }
  const left = key === "name" ? customerName(a) : key === "email" ? a.email || "" : menuLabel(a);
  const right = key === "name" ? customerName(b) : key === "email" ? b.email || "" : menuLabel(b);
  return left.localeCompare(right, "tr", { sensitivity: "base" }) * mul;
}

function SortHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export default function MenuCustomersView() {
  const { accessLoading, canUseWaiterPanel } = useWaiterPanelAccess();

  const [search, setSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState(ALL_MENUS);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const customersQuery = useQuery({
    queryKey: ["business-customers"],
    enabled: canUseWaiterPanel && !accessLoading,
    queryFn: listBusinessCustomers,
  });

  const customers = customersQuery.data ?? [];
  const query = search.trim().toLocaleLowerCase("tr");

  const menuFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of customers) {
      if (item.menuId == null) continue;
      const key = String(item.menuId);
      if (!seen.has(key)) {
        seen.set(key, menuLabel(item));
      }
    }
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr", { sensitivity: "base" }));
  }, [customers]);

  const filtered = useMemo(() => {
    const scoped =
      menuFilter === ALL_MENUS
        ? customers
        : customers.filter((item) => item.menuId != null && String(item.menuId) === menuFilter);
    const searched = scoped.filter((item) =>
      matchesSearch(`${customerName(item)} ${item.email ?? ""} ${menuLabel(item)}`, query),
    );
    return [...searched].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [customers, menuFilter, query, sortKey, sortDir]);

  function toggleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setSortDir(column === "date" ? "desc" : "asc");
  }

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <DashboardPageHeader
          title="Müşteriler"
          hint="İşletmenize kayıtlı tüm müşteriler (silinen menüler dahil)"
        />
        <DashboardLoadingState label="Müşteriler hazırlanıyor..." />
      </div>
    );
  }

  const scopedEmpty =
    menuFilter === ALL_MENUS
      ? customers.length === 0
      : customers.every((item) => item.menuId == null || String(item.menuId) !== menuFilter);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <DashboardPageHeader
        title="Müşteriler"
        hint="İşletmenize kayıtlı tüm müşteriler (silinen menüler dahil)"
      />

      {customersQuery.isError ? (
        <p className="text-sm text-destructive">
          {customersQuery.error instanceof Error
            ? customersQuery.error.message
            : "Müşteriler yüklenemedi."}
        </p>
      ) : null}

      {customersQuery.isLoading ? (
        <DashboardLoadingState label="Müşteriler yükleniyor..." />
      ) : (
        <>
          {menuFilterOptions.length > 0 ? (
            <DashboardFilterBar>
              <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
                <Label className="text-xs text-muted-foreground">Menü</Label>
                <SearchableSelect
                  value={menuFilter}
                  onValueChange={setMenuFilter}
                  options={[
                    { value: ALL_MENUS, label: "Tümü" },
                    ...menuFilterOptions,
                  ]}
                  placeholder="Menü seçin"
                  searchPlaceholder="Menü ara..."
                  emptyText="Menü bulunamadı."
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
                <Label className="text-xs text-muted-foreground">Ara</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ad, e-posta veya menü ara…"
                    className="h-9 pl-9"
                    aria-label="Müşteri ara"
                  />
                </div>
              </div>
            </DashboardFilterBar>
          ) : null}

          {scopedEmpty ? (
            <EmptyState
              title="Henüz müşteri yok"
              description="Menü müşterileri kayıt oldukça burada listelenir."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Eşleşen müşteri yok"
              description="Arama veya menü filtresini değiştirip tekrar deneyin."
            />
          ) : (
            <div className={`${DASHBOARD_SURFACE} overflow-hidden`}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-10">
                      <SortHead label="Ad" column="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    <TableHead className="h-10">
                      <SortHead label="E-posta" column="email" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    <TableHead className="h-10">
                      <SortHead label="Menü" column="menu" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    <TableHead className="h-10">
                      <SortHead
                        label="Kayıt tarihi"
                        column="date"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={`${item.customerId}-${item.menuId ?? "na"}`}>
                      <TableCell className="py-3 font-medium">{customerName(item)}</TableCell>
                      <TableCell className="max-w-[14rem] truncate py-3 text-muted-foreground">
                        {item.email || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">{menuLabel(item)}</TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatDate(item.memberSince || item.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
