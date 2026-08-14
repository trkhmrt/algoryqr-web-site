"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  useWaiterPanelAccess,
  WaiterPanelGate,
} from "@/components/dashboard/waiter/WaiterPanelAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
  deleteMenuWaiter,
  listMenuUsers,
  WaiterApiError,
  updateMenuWaiter,
} from "@/lib/waiter-api";

type MenuUserDetailViewProps = {
  waiterId: number;
};

function formatJoinedAt(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MenuUserDetailView({ waiterId }: MenuUserDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");

  const { accessLoading: waiterAccessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { accessLoading: menuAccessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const accessLoading = waiterAccessLoading || menuAccessLoading;
  const { menuQrs, selection, loading, error, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseWaiterPanel && canUseDigitalMenu && !accessLoading,
  );

  const menuId = selection?.menu.menuId ?? null;

  const usersQuery = useQuery({
    queryKey: ["menu-users", menuId],
    enabled: menuId != null,
    queryFn: () => listMenuUsers(menuId!),
  });

  const member = useMemo(
    () => (usersQuery.data?.waiters ?? []).find((w) => w.id === waiterId) ?? null,
    [usersQuery.data?.waiters, waiterId],
  );

  const backHref = selection?.qr.id
    ? DASHBOARD_ROUTES.menuUsersForQr(selection.qr.id)
    : DASHBOARD_ROUTES.menuUsers;

  const updateMutation = useMutation({
    mutationFn: (payload: { password?: string; active?: boolean }) =>
      updateMenuWaiter(menuId!, waiterId, payload),
    onSuccess: async (_data, vars) => {
      if (vars.password) setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["menu-users", menuId] });
      notify("info", "Kullanıcı güncellendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof WaiterApiError ? err.message : "Güncelleme başarısız.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMenuWaiter(menuId!, waiterId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-users", menuId] });
      notify("info", "Kullanıcı pasifleştirildi.");
      router.push(backHref);
    },
    onError: (err) => {
      notify("danger", err instanceof WaiterApiError ? err.message : "İşlem başarısız.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseWaiterPanel) {
    return (
      <WaiterPanelGate accessLoading={false} canUse={false}>
        {null}
      </WaiterPanelGate>
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

  const busy = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {member?.displayName || "Kullanıcı detayı"}
          </h1>
          <p className="text-sm text-muted-foreground">Garson hesabı</p>
        </div>
      </div>

      <DigitalMenuPicker
        menuQrs={menuQrs}
        selectedQrId={selection?.qr.id ?? null}
        onSelectQrId={(qrId) => {
          void selectQrId(qrId);
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!menuId ? (
        <p className="text-sm text-muted-foreground">Menü seçin.</p>
      ) : usersQuery.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !member ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
          <Button variant="outline" asChild>
            <Link href={backHref}>Listeye dön</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{member.displayName}</p>
              <span
                className={
                  member.active
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                    : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                }
              >
                {member.active ? "Aktif" : "Pasif"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">@{member.username}</p>
            <p className="text-sm text-muted-foreground">
              Eklenme: {formatJoinedAt(member.createdAt)}
            </p>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Şifre sıfırla</h2>
            <div className="space-y-1.5">
              <Label htmlFor="detail-password">Yeni şifre</Label>
              <Input
                id="detail-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <Button
              type="button"
              disabled={busy || password.trim().length < 6}
              onClick={() => updateMutation.mutate({ password: password.trim() })}
            >
              {updateMutation.isPending && password ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Şifreyi güncelle"
              )}
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Hesap</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pasifleştirilen garson giriş yapamaz.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-3"
              disabled={busy || !member.active}
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  !window.confirm(`${member.displayName} pasifleştirilsin mi?`)
                ) {
                  return;
                }
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Pasifleştir"
              )}
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
