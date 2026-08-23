"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { BranchPicker, useBranchSelection } from "@/components/dashboard/BranchPicker";
import { useWaiterPanelAccess } from "@/components/dashboard/waiter/WaiterPanelAccess";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import {
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
  const searchParams = useSearchParams();
  const branchFromQuery = Number(searchParams.get("branch"));
  const initialBranchId =
    Number.isFinite(branchFromQuery) && branchFromQuery > 0 ? branchFromQuery : null;
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [commissionEnabled, setCommissionEnabled] = useState(false);
  const [commissionType, setCommissionType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [commissionScope, setCommissionScope] = useState<"PER_ITEM" | "BILL_TOTAL">("PER_ITEM");
  const [commissionValue, setCommissionValue] = useState("");
  const [accountAction, setAccountAction] = useState<"deactivate" | "activate" | null>(null);

  const { accessLoading, canUseWaiterPanel } = useWaiterPanelAccess();
  const { branches, branchId, loading, error, select } = useBranchSelection(
    initialBranchId,
    canUseWaiterPanel && !accessLoading,
  );

  const usersQuery = useQuery({
    queryKey: ["menu-users", branchId],
    enabled: branchId != null,
    queryFn: () => listMenuUsers(branchId!),
  });

  const member = useMemo(
    () => (usersQuery.data?.waiters ?? []).find((w) => w.id === waiterId) ?? null,
    [usersQuery.data?.waiters, waiterId],
  );

  useEffect(() => {
    if (!member) return;
    setCommissionEnabled(Boolean(member.commissionEnabled));
    setCommissionType(member.commissionType === "FIXED" ? "FIXED" : "PERCENT");
    setCommissionScope(member.commissionScope === "BILL_TOTAL" ? "BILL_TOTAL" : "PER_ITEM");
    const raw = member.commissionValue;
    if (raw == null || raw === "") {
      setCommissionValue("");
      return;
    }
    setCommissionValue(String(raw));
  }, [member]);

  const backHref =
    branchId != null
      ? DASHBOARD_ROUTES.menuUsersForBranch(branchId)
      : DASHBOARD_ROUTES.menuUsers;

  const updateMutation = useMutation({
    mutationFn: (payload: {
      password?: string;
      active?: boolean;
      commissionEnabled?: boolean;
      commissionType?: "PERCENT" | "FIXED";
      commissionScope?: "PER_ITEM" | "BILL_TOTAL";
      commissionValue?: number;
    }) => updateMenuWaiter(branchId!, waiterId, payload),
    onSuccess: async (_data, vars) => {
      if (vars.password) setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["menu-users", branchId] });
      if (vars.active === true) {
        notify("info", "Kullanıcı aktifleştirildi.");
      } else if (vars.active === false) {
        notify("info", "Kullanıcı pasifleştirildi.");
      } else {
        notify("info", "Kullanıcı güncellendi.");
      }
    },
    onError: (err) => {
      notify("danger", err instanceof WaiterApiError ? err.message : "Güncelleme başarısız.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const busy = updateMutation.isPending;

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

      <BranchPicker
        branches={branches}
        selectedBranchId={branchId}
        onSelect={select}
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

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Komisyon</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={commissionEnabled}
                onChange={(e) => setCommissionEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Komisyon ile çalışır
            </label>
            {commissionEnabled ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm ${
                      commissionScope === "PER_ITEM"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                    }`}
                    onClick={() => setCommissionScope("PER_ITEM")}
                  >
                    Ürün başına
                  </button>
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm ${
                      commissionScope === "BILL_TOTAL"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                    }`}
                    onClick={() => setCommissionScope("BILL_TOTAL")}
                  >
                    Hesap toplamı
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm ${
                      commissionType === "PERCENT"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                    }`}
                    onClick={() => setCommissionType("PERCENT")}
                  >
                    Yüzde (%)
                  </button>
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm ${
                      commissionType === "FIXED"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                    }`}
                    onClick={() => setCommissionType("FIXED")}
                  >
                    Sabit tutar (TL)
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="commission-value">
                    {commissionType === "PERCENT" ? "Yüzde değeri" : "Sabit tutar"}
                  </Label>
                  <Input
                    id="commission-value"
                    type="number"
                    min={0}
                    max={commissionType === "PERCENT" ? 100 : undefined}
                    step={commissionType === "PERCENT" ? "0.1" : "0.01"}
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    placeholder={commissionType === "PERCENT" ? "örn. 5" : "örn. 50"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {commissionType === "PERCENT"
                      ? "Her onaylanan sipariş toplamı üzerinden hesaplanır."
                      : "Komisyon muaf ürünler hariç, adisyona eklenen her ürün adedi için uygulanır."}
                  </p>
                </div>
              </>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (commissionEnabled) {
                  const parsed = Number.parseFloat(commissionValue);
                  if (!Number.isFinite(parsed) || parsed < 0) {
                    notify("danger", "Geçerli bir komisyon değeri girin.");
                    return;
                  }
                  if (commissionType === "PERCENT" && parsed > 100) {
                    notify("danger", "Yüzde komisyon 100'den büyük olamaz.");
                    return;
                  }
                  updateMutation.mutate({
                    commissionEnabled: true,
                    commissionType,
                    commissionScope,
                    commissionValue: parsed,
                  });
                  return;
                }
                updateMutation.mutate({ commissionEnabled: false });
              }}
            >
              Komisyon ayarını kaydet
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Hesap</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {member.active
                ? "Pasifleştirilen garson giriş yapamaz."
                : "Aktifleştirilen garson tekrar giriş yapabilir."}
            </p>
            {member.active ? (
              <Button
                type="button"
                variant="destructive"
                className="mt-3"
                disabled={busy}
                onClick={() => setAccountAction("deactivate")}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Pasifleştir"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="mt-3"
                disabled={busy}
                onClick={() => setAccountAction("activate")}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aktifleştir"
                )}
              </Button>
            )}
          </section>
        </div>
      )}

      <AlertDialog
        open={accountAction != null}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) {
            setAccountAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountAction === "activate" ? "Garson aktifleştirilsin mi?" : "Garson pasifleştirilsin mi?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accountAction === "activate" ? (
                <>
                  <span className="font-medium text-foreground">{member?.displayName}</span> tekrar
                  giriş yapabilecek.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{member?.displayName}</span> giriş
                  yapamayacak.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMutation.isPending}
              className={accountAction === "deactivate" ? "bg-destructive hover:bg-destructive/90" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!accountAction) return;
                updateMutation.mutate(
                  { active: accountAction === "activate" },
                  {
                    onSuccess: () => setAccountAction(null),
                  },
                );
              }}
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {accountAction === "activate" ? "Aktifleştir" : "Pasifleştir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
