"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from "lucide-react";

import {
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
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
import { listMenuCustomers, type MenuCustomerItem } from "@/lib/waiter-api";
import { cn } from "@/lib/utils";

const ALL_MENUS = "all";

type SortKey = "name" | "email" | "menu" | "date";
type SortDir = "asc" | "desc";

type CustomerRow = MenuCustomerItem & {
  menuId: number;
  menuName: string;
};

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

function compareRows(a: CustomerRow, b: CustomerRow, key: SortKey, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "date") {
    return (dateValue(a) - dateValue(b)) * mul;
  }
  const left =
    key === "name" ? customerName(a) : key === "email" ? a.email || "" : a.menuName;
  const right =
    key === "name" ? customerName(b) : key === "email" ? b.email || "" : b.menuName;
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
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, loading, error } = useDigitalMenuOptions(canUseDigitalMenu && !accessLoading);

  const [search, setSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState(ALL_MENUS);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const menuTargets = useMemo(
    () =>
      menuQrs
        .map((qr) => {
          const fromDetails =
            typeof qr.details?.menuId === "number" ? qr.details.menuId : null;
          const menuId = qr.menuId ?? fromDetails;
          return menuId != null ? { menuId, menuName: qr.name } : null;
        })
        .filter((item): item is { menuId: number; menuName: string } => item != null),
    [menuQrs],
  );

  const customersQuery = useQuery({
    queryKey: ["menu-customers-all", menuTargets.map((item) => item.menuId)],
    enabled: menuTargets.length > 0,
    queryFn: async (): Promise<CustomerRow[]> => {
      const groups = await Promise.all(
        menuTargets.map(async (target) => {
          const items = await listMenuCustomers(target.menuId);
          return items.map((item) => ({
            ...item,
            menuId: target.menuId,
            menuName: target.menuName,
          }));
        }),
      );
      return groups.flat();
    },
  });

  const customers = customersQuery.data ?? [];
  const query = search.trim().toLocaleLowerCase("tr");

  const filtered = useMemo(() => {
    const scoped =
      menuFilter === ALL_MENUS
        ? customers
        : customers.filter((item) => String(item.menuId) === menuFilter);
    const searched = scoped.filter((item) =>
      matchesSearch(`${customerName(item)} ${item.email ?? ""} ${item.menuName}`, query),
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

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={DASHBOARD_ROUTES.digitalMenu}>Dijital Menüye Dön</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Bu özellik için PRO paket gerekir.</p>
      </div>
    );
  }

  const scopedEmpty =
    menuFilter === ALL_MENUS
      ? customers.length === 0
      : customers.every((item) => String(item.menuId) !== menuFilter);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Müşteriler</h1>
        <p className="text-sm text-muted-foreground">Menüye kayıtlı müşteriler</p>
      </div>

      {menuQrs.length > 0 ? (
        <div className="max-w-md space-y-1.5">
          <Label className="text-xs text-muted-foreground">Menü</Label>
          <SearchableSelect
            value={menuFilter}
            onValueChange={setMenuFilter}
            options={[
              { value: ALL_MENUS, label: "Tümü" },
              ...menuTargets.map((item) => ({
                value: String(item.menuId),
                label: item.menuName,
              })),
            ]}
            placeholder="Menü seçin"
            searchPlaceholder="Menü ara..."
            emptyText="Menü bulunamadı."
          />
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Menüler yüklenemedi."}
        </p>
      ) : null}

      {menuTargets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Menü bulunamadı.</p>
      ) : customersQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, e-posta veya menü ara…"
              className="h-9 pl-9"
              aria-label="Müşteri ara"
            />
          </div>
          {scopedEmpty ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Henüz müşteri yok.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Aramanızla eşleşen müşteri yok.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
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
                    <TableRow key={`${item.customerId}-${item.menuId}`}>
                      <TableCell className="py-3 font-medium">{customerName(item)}</TableCell>
                      <TableCell className="max-w-[14rem] truncate py-3 text-muted-foreground">
                        {item.email || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">{item.menuName}</TableCell>
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
