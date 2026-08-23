"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus, Search, UserRound } from "lucide-react";

import { BranchPicker, useBranchSelection } from "@/components/dashboard/BranchPicker";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  createMenuWaiter,
  listMenuUsers,
  WaiterApiError,
} from "@/lib/waiter-api";
import { cn } from "@/lib/utils";

function ownerName(owner: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  return name || owner.email || "Ana kullanıcı";
}

function matchesSearch(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLocaleLowerCase("tr").includes(query);
}

function StatusTag({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        active
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Aktif" : "Pasif"}
    </span>
  );
}

export default function MenuUsersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchFromQuery = Number(searchParams.get("branch"));
  const initialBranchId =
    Number.isFinite(branchFromQuery) && branchFromQuery > 0 ? branchFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();

  const { accessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { branches, branchId, loading, error, select } = useBranchSelection(
    initialBranchId,
    canUseWaiterPanel && !accessLoading,
  );

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const usersQuery = useQuery({
    queryKey: ["menu-users", branchId],
    enabled: branchId != null,
    queryFn: () => listMenuUsers(branchId!),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createMenuWaiter(branchId!, {
        username: username.trim(),
        password,
        displayName: displayName.trim(),
      }),
    onSuccess: async () => {
      setUsername("");
      setPassword("");
      setDisplayName("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["menu-users", branchId] });
      notify("info", "Kullanıcı eklendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof WaiterApiError ? err.message : "Kullanıcı eklenemedi.");
    },
  });

  const owner = usersQuery.data?.owner;
  const waiters = usersQuery.data?.waiters ?? [];
  const query = search.trim().toLocaleLowerCase("tr");

  const filteredWaiters = useMemo(
    () =>
      waiters.filter((member) =>
        matchesSearch(
          [member.displayName, member.username, "garson"].join(" "),
          query,
        ),
      ),
    [waiters, query],
  );

  const resetCreateForm = () => {
    setUsername("");
    setPassword("");
    setDisplayName("");
  };

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 animate-fade-in pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">Ana kullanıcı ve garson hesapları</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={!branchId}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni kullanıcı
        </Button>
      </div>

      <BranchPicker
        branches={branches}
        selectedBranchId={branchId}
        onSelect={(id) => {
          select(id);
          router.replace(DASHBOARD_ROUTES.menuUsersForBranch(id));
        }}
      />
      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Şubeler alınamadı."}
        </p>
      ) : null}

      {!branchId ? (
        <p className="text-sm text-muted-foreground">Şube seçin.</p>
      ) : usersQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {owner ? (
            <article className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{ownerName(owner)}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Ana
                    </span>
                  </div>
                  {owner.email ? (
                    <p className="truncate text-sm text-muted-foreground">{owner.email}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}

          <section className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">Garsonlar</h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Kullanıcı ara…"
                  className="h-9 pl-9"
                  aria-label="Kullanıcı ara"
                />
              </div>
            </div>
            {filteredWaiters.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {query ? "Aramanızla eşleşen garson yok." : "Henüz garson yok."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad</TableHead>
                      <TableHead>Kullanıcı adı</TableHead>
                      <TableHead className="w-[90px]">Durum</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaiters.map((member) => {
                      const href = DASHBOARD_ROUTES.menuUserDetail(
                        member.id,
                        branchId,
                      );
                      return (
                        <TableRow
                          key={member.id}
                          className="cursor-pointer"
                          onClick={() => router.push(href)}
                        >
                          <TableCell className="font-medium">
                            {member.displayName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            @{member.username}
                          </TableCell>
                          <TableCell>
                            <StatusTag active={member.active} />
                          </TableCell>
                          <TableCell className="text-right">
                            <ChevronRight
                              className="ml-auto h-4 w-4 text-muted-foreground"
                              aria-hidden
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Yeni kullanıcı</DialogTitle>
            <DialogDescription>
              Garson (alt kullanıcı) hesabı oluşturun. Giriş: kullanıcı adı + şifre.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!branchId || createMutation.isPending) return;
              createMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="waiter-display">Görünen ad</Label>
              <Input
                id="waiter-display"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waiter-username">Kullanıcı adı</Label>
              <Input
                id="waiter-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waiter-password">Şifre</Label>
              <Input
                id="waiter-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !username.trim() ||
                  !password ||
                  !displayName.trim()
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ekle"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
