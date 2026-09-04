"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Settings2,
} from "lucide-react";

import { DigitalMenuHubShell } from "@/components/dashboard/digital-menu/DigitalMenuHubShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListQueryState } from "@/hooks/use-list-query-state";
import { useBranches } from "@/hooks/use-branches";
import type { BranchItem, BranchMenuSummary } from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Yayında" },
  { value: "inactive", label: "Pasif" },
];

function menuTitle(menu: BranchMenuSummary): string {
  return menu.businessName?.trim() || `Menü #${menu.qrId}`;
}

function branchMatches(
  branch: BranchItem,
  query: string,
  status: StatusFilter,
): { branch: BranchItem; menus: BranchMenuSummary[] } | null {
  const needle = query.trim().toLocaleLowerCase("tr-TR");
  const menus = branch.menus.filter((menu) => {
    if (status === "active" && !menu.active) return false;
    if (status === "inactive" && menu.active) return false;
    if (!needle) return true;
    const haystack = `${menuTitle(menu)} ${branch.name}`.toLocaleLowerCase("tr-TR");
    return haystack.includes(needle);
  });

  if (!needle) return { branch, menus };

  const branchHit = branch.name.toLocaleLowerCase("tr-TR").includes(needle);
  if (branchHit) {
    return {
      branch,
      menus: branch.menus.filter((menu) => {
        if (status === "active" && !menu.active) return false;
        if (status === "inactive" && menu.active) return false;
        return true;
      }),
    };
  }

  if (menus.length === 0) return null;
  return { branch, menus };
}

export function DigitalMenuDirectoryPanel() {
  const router = useRouter();
  const { searchParams, setQuery: setListQuery } = useListQueryState();
  const branchesQuery = useBranches(true);
  const branches = branchesQuery.data?.content ?? [];
  const canCreateBranch = Boolean(branchesQuery.data?.quota.canCreate);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState<StatusFilter>(
    () => (searchParams.get("status") as StatusFilter) || "all",
  );

  const groups = useMemo(() => {
    const sorted = [...branches].sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
    return sorted
      .map((branch) => branchMatches(branch, query, status))
      .filter((group): group is { branch: BranchItem; menus: BranchMenuSummary[] } => group != null);
  }, [branches, query, status]);

  const totalMenus = branches.reduce((sum, branch) => sum + branch.menus.length, 0);
  const createBranchHref = canCreateBranch
    ? DASHBOARD_ROUTES.branchCreate
    : DASHBOARD_ROUTES.catalogProductCheckout("QR_BRANCH");

  return (
    <DigitalMenuHubShell>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  setListQuery({ q: next.trim() || null });
                }}
                placeholder="Şube veya menü ara"
                className="h-9 pl-9"
                aria-label="Şube veya menü ara"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {STATUS_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setStatus(chip.value);
                    setListQuery({ status: chip.value === "all" ? null : chip.value });
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    status === chip.value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 border-border bg-white px-3 text-xs font-medium shadow-none dark:bg-card"
              onClick={() => router.push(createBranchHref)}
            >
              <Plus className="h-3.5 w-3.5" />
              {canCreateBranch ? "Yeni şube" : "Şube hakkı al"}
            </Button>
          </div>

        {branchesQuery.isLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        ) : branches.length === 0 ? (
          <EmptyState
            title="Henüz şube yok"
            description="Menü eklemek için önce bir şube (lokasyon) oluşturun."
            action={
              <Button onClick={() => router.push(createBranchHref)}>
                <Building2 className="mr-2 h-4 w-4" />
                {canCreateBranch ? "İlk şubeyi ekle" : "Şube hakkı satın al"}
              </Button>
            }
          />
        ) : groups.length === 0 ? (
          <EmptyState
            title="Sonuç yok"
            description="Arama veya filtreyi değiştirip tekrar deneyin."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setListQuery({ q: null, status: null });
                }}
              >
                Temizle
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {groups.length} şube · {totalMenus} menü
            </p>

            {groups.map(({ branch, menus }) => (
              <section
                key={branch.id}
                className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-border dark:bg-card"
              >
                <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/30 px-3 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {branch.photoUrl ? (
                      <img
                        src={branch.photoUrl}
                        alt=""
                        className="h-10 w-10 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                          Şube
                        </span>
                        {!branch.active ? (
                          <span className="text-[10px] font-medium text-muted-foreground">Pasif</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                        {branch.name}
                      </p>
                      {branch.address ? (
                        <p className="truncate text-xs text-muted-foreground">{branch.address}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                      <Link href={DASHBOARD_ROUTES.branchSettings(branch.id)}>
                        <Settings2 className="h-3.5 w-3.5" />
                        Şube ayarları
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
                      <Link href={DASHBOARD_ROUTES.digitalMenuCreateForBranch(branch.id)}>
                        <Plus className="h-3.5 w-3.5" />
                        Menü ekle
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="px-3 py-2">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    Bu şubedeki menüler
                  </p>

                  {menus.length === 0 ? (
                    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border px-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Bu şubeye henüz menü eklenmedi.
                      </p>
                      <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <Link href={DASHBOARD_ROUTES.digitalMenuCreateForBranch(branch.id)}>
                          <Plus className="h-3.5 w-3.5" />
                          İlk menüyü ekle
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {menus.map((menu) => (
                        <li key={menu.menuId}>
                          <Link
                            href={DASHBOARD_ROUTES.digitalMenuEdit(menu.qrId)}
                            className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                              <BookOpen className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Menü
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                    menu.active
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {menu.active ? "Yayında" : "Pasif"}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                                {menuTitle(menu)}
                              </p>
                            </div>
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                              Düzenle
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DigitalMenuHubShell>
  );
}
