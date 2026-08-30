"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search } from "lucide-react";

import { DigitalMenuHubShell } from "@/components/dashboard/digital-menu/DigitalMenuHubShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { useBranches } from "@/hooks/use-branches";
import { formatBranchMenuQuota } from "@/lib/branch";
import {
  DEFAULT_MENU_DIRECTORY_FILTERS,
  filterMenuDirectory,
  flattenBranchMenus,
  sortMenuDirectory,
  type MenuDirectoryStatusFilter,
} from "@/lib/digital-menu-directory";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const STATUS_OPTIONS: Array<{ value: MenuDirectoryStatusFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Yayında" },
  { value: "inactive", label: "Pasif" },
];

export function DigitalMenuMenusPanel() {
  const router = useRouter();
  const { searchParams, setQuery: setListQuery } = useListQueryState();
  const branchesQuery = useBranches(true);
  const branches = branchesQuery.data?.content ?? [];
  const [query, setQuery] = useState(
    () => searchParams.get("q") ?? DEFAULT_MENU_DIRECTORY_FILTERS.query,
  );
  const [status, setStatus] = useState<MenuDirectoryStatusFilter>(
    () => (searchParams.get("status") as MenuDirectoryStatusFilter) || DEFAULT_MENU_DIRECTORY_FILTERS.status,
  );
  const [branchId, setBranchId] = useState<number | "all">(() => {
    const raw = searchParams.get("branch");
    if (!raw || raw === "all") return "all";
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : "all";
  });

  const allMenus = useMemo(() => sortMenuDirectory(flattenBranchMenus(branches)), [branches]);
  const filteredMenus = useMemo(
    () => filterMenuDirectory(allMenus, { query, status, branchId }),
    [allMenus, branchId, query, status],
  );
  const menuQuotaLabel = formatBranchMenuQuota(branchesQuery.data?.menuQuota);

  return (
    <DigitalMenuHubShell
      title="Menüler"
      hint={menuQuotaLabel}
      action={
        <Button onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}>
          Menü oluştur
        </Button>
      }
    >
      <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-none dark:border-border dark:bg-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="menu-search" className="text-xs text-muted-foreground">
              Ara
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="menu-search"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  setListQuery({ q: next.trim() || null });
                }}
                placeholder="Menü veya şube adı"
                className="pl-9"
              />
            </div>
          </div>

          <FilterSelect
            label="Durum"
            value={status}
            onValueChange={(next) => {
              const value = next as MenuDirectoryStatusFilter;
              setStatus(value);
              setListQuery({ status: value === "all" ? null : value });
            }}
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            label="Şube"
            value={branchId === "all" ? "all" : String(branchId)}
            onValueChange={(next) => {
              const value = next === "all" ? "all" : Number(next);
              setBranchId(value);
              setListQuery({ branch: value === "all" ? null : String(value) });
            }}
            options={[
              { value: "all", label: "Tüm şubeler" },
              ...branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
            ]}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {filteredMenus.length} / {allMenus.length} menü
        </p>
      </div>

      {branchesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menüler yükleniyor…
        </div>
      ) : allMenus.length === 0 ? (
        <EmptyState
          title="Henüz menü yok"
          description="İlk menünüzü oluşturup QR ile yayınlayın."
          action={
            <Button onClick={() => router.push(DASHBOARD_ROUTES.digitalMenuCreate)}>
              İlk menüyü oluştur
            </Button>
          }
        />
      ) : filteredMenus.length === 0 ? (
        <EmptyState
          title="Filtrelere uyan menü yok"
          description="Arama, durum veya şube filtresini temizleyip tekrar deneyin."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setBranchId("all");
                setListQuery({ q: null, status: null, branch: null });
              }}
            >
              Filtreleri temizle
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredMenus.map((menu) => (
            <Link
              key={menu.menuId}
              href={DASHBOARD_ROUTES.digitalMenuEdit(menu.qrId)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 transition-colors hover:bg-muted/40 dark:border-border dark:bg-card"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{menu.businessName}</p>
                <p className="truncate text-xs text-muted-foreground">{menu.branchName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={
                    menu.active
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                      : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  {menu.active ? "Yayında" : "Pasif"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DigitalMenuHubShell>
  );
}
