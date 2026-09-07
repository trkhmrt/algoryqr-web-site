"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { BranchPicker, useBranchSelection } from "@/components/dashboard/BranchPicker";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { MoneyInput, parseMoneyInput } from "@/components/ui/money-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import {
  DASHBOARD_FILTER_FIELD,
  DASHBOARD_FILTER_LABEL,
  DASHBOARD_PANEL,
  DASHBOARD_STAT_TILE,
} from "@/lib/dashboard-surface";
import { cn } from "@/lib/utils";
import {
  ApiError,
  createAccountingEntryRequest,
  createBranchFixedExpenseRequest,
  deleteAccountingEntryRequest,
  deleteBranchFixedExpenseRequest,
  getAccountingEntryDetailRequest,
  listAccountingEntriesRequest,
  listBranchFixedExpensesRequest,
  type AccountingEntryApiItem,
  type AccountingEntryType,
  type AccountingSourceType,
  type BranchFixedExpenseItem,
  type FixedExpensePeriod,
} from "@/lib/api";

type TypeFilter = AccountingEntryType | "all";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value: number | string, currency = "TRY"): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function toLocalInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function entryTypeLabel(type: AccountingEntryType): string {
  switch (type) {
    case "GELIR":
      return "Gelir";
    case "GIDER":
      return "Gider";
    case "BORC":
      return "Borç";
    default:
      return type;
  }
}

function sourceTypeLabel(type: AccountingSourceType): string {
  switch (type) {
    case "BILL_SALE":
      return "Adisyon satışı";
    case "BILL_TIP":
      return "Bahşiş";
    case "ORDER_SALE":
      return "Sipariş satışı";
    case "MANUAL":
      return "Manuel kayıt";
    default:
      return type;
  }
}

function canLoadEntryLines(item: AccountingEntryApiItem): boolean {
  return (
    item.sourceType === "BILL_SALE" ||
    item.sourceBillId != null ||
    item.sourceOrderId != null
  );
}

function entryTypeClass(type: AccountingEntryType): string {
  switch (type) {
    case "GELIR":
      return "bg-emerald-500/15 text-emerald-700";
    case "GIDER":
      return "bg-red-500/15 text-red-700";
    case "BORC":
      return "bg-amber-500/15 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function periodLabel(period: FixedExpensePeriod): string {
  switch (period) {
    case "DAILY":
      return "Günlük";
    case "WEEKLY":
      return "Haftalık";
    case "MONTHLY":
      return "Aylık";
    case "YEARLY":
      return "Yıllık";
    default:
      return period;
  }
}

type ExpenseMode = "ONE_TIME" | "FIXED";

export default function AccountingView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();

  const { canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs } = useDigitalMenuOptions(canUseDigitalMenu);
  const {
    branches,
    branchId: fixedExpenseBranchId,
    select: selectFixedExpenseBranch,
    loading: branchesLoading,
  } = useBranchSelection(null, true);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [detailItem, setDetailItem] = useState<AccountingEntryApiItem | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<AccountingEntryType>("GELIR");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(toLocalInputValue());
  const [note, setNote] = useState("");
  const [formMenuId, setFormMenuId] = useState<number | null>(null);
  const [expenseMode, setExpenseMode] = useState<ExpenseMode>("ONE_TIME");
  const [expensePeriod, setExpensePeriod] = useState<FixedExpensePeriod>("MONTHLY");
  const [dialogBranchId, setDialogBranchId] = useState<number | null>(null);

  const fixedExpenseQuery = useQuery({
    queryKey: ["branch-fixed-expenses", fixedExpenseBranchId],
    queryFn: () => listBranchFixedExpensesRequest(fixedExpenseBranchId as number),
    enabled: fixedExpenseBranchId != null,
  });

  const createFixedExpenseMutation = useMutation({
    mutationFn: (payload: {
      branchId: number;
      title: string;
      amount: number;
      period: FixedExpensePeriod;
    }) =>
      createBranchFixedExpenseRequest(payload.branchId, {
        title: payload.title,
        amount: payload.amount,
        period: payload.period,
        active: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["branch-fixed-expenses"] });
      setDialogOpen(false);
      resetForm();
      notify("info", "Sabit gider eklendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Sabit gider eklenemedi.");
    },
  });

  const deleteFixedExpenseMutation = useMutation({
    mutationFn: (payload: { branchId: number; expenseId: number }) =>
      deleteBranchFixedExpenseRequest(payload.branchId, payload.expenseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["branch-fixed-expenses"] });
      notify("info", "Sabit gider silindi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Sabit gider silinemedi.");
    },
  });

  const listQuery = useQuery({
    queryKey: ["accounting-entries", typeFilter, q, from, to, page],
    queryFn: () =>
      listAccountingEntriesRequest({
        type: typeFilter,
        q: q.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        size: 20,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAccountingEntryRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      setDialogOpen(false);
      resetForm();
      notify("info", "Kayıt eklendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Kayıt eklenemedi.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccountingEntryRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      setDetailItem(null);
      notify("info", "Kayıt silindi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Kayıt silinemedi.");
    },
  });

  const items = listQuery.data?.content ?? [];
  const totalPages = listQuery.data?.totalPages ?? 0;
  const summary = listQuery.data?.summary;

  const summaryCards = useMemo(
    () => [
      { label: "Toplam Gelir", value: formatAmount(summary?.totalGelir ?? 0) },
      { label: "Toplam Gider", value: formatAmount(summary?.totalGider ?? 0) },
      { label: "Toplam Borç", value: formatAmount(summary?.totalBorc ?? 0) },
    ],
    [summary],
  );

  function resetForm() {
    setTitle("");
    setAmount("");
    setOccurredAt(toLocalInputValue());
    setNote("");
    setFormMenuId(null);
    setExpenseMode("ONE_TIME");
    setExpensePeriod("MONTHLY");
    setDialogBranchId(fixedExpenseBranchId);
  }

  function openDialog(entryType: AccountingEntryType) {
    setDialogType(entryType);
    resetForm();
    setDialogOpen(true);
  }

  function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    if (!title.trim()) {
      notify("danger", "Başlık zorunludur.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01) {
      notify("danger", "Geçerli bir tutar girin.");
      return;
    }

    if (dialogType === "GIDER" && expenseMode === "FIXED") {
      const branchId = dialogBranchId ?? fixedExpenseBranchId;
      if (branchId == null) {
        notify("danger", "Şube seçin.");
        return;
      }
      createFixedExpenseMutation.mutate({
        branchId,
        title: title.trim(),
        amount: parsedAmount,
        period: expensePeriod,
      });
      return;
    }

    if (!occurredAt) {
      notify("danger", "İşlem tarihi zorunludur.");
      return;
    }

    createMutation.mutate({
      entryType: dialogType,
      title: title.trim(),
      amount: parsedAmount,
      occurredAt: fromLocalInputValue(occurredAt),
      note: note.trim() || undefined,
      menuId: dialogType === "GELIR" && formMenuId != null ? formMenuId : undefined,
    });
  }

  const saving = createMutation.isPending || createFixedExpenseMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Muhasebe"
        hint="Gelir, gider ve borç kayıtlarınızı takip edin."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openDialog("GELIR")}>Gelir Gir</Button>
            <Button variant="outline" onClick={() => openDialog("GIDER")}>
              Gider Gir
            </Button>
            <Button variant="outline" onClick={() => openDialog("BORC")}>
              Borç Gir
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className={DASHBOARD_STAT_TILE}>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className={`${DASHBOARD_PANEL} space-y-4`}>
        <div>
          <h2 className="text-base font-semibold text-foreground">Sabit giderler</h2>
          <p className="text-xs text-muted-foreground">
            Şube bazlı periyodik giderler ciro raporunda otomatik düşülür. Yeni kayıt için
            &quot;Gider Gir&quot; → Sabit seçin.
          </p>
        </div>
        {branchesLoading ? (
          <DashboardLoadingState label="Şubeler yükleniyor…" />
        ) : (
          <BranchPicker
            branches={branches}
            selectedBranchId={fixedExpenseBranchId}
            onSelect={selectFixedExpenseBranch}
          />
        )}
        {fixedExpenseBranchId != null ? (
          fixedExpenseQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {(fixedExpenseQuery.data ?? []).length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">Sabit gider yok.</li>
              ) : (
                (fixedExpenseQuery.data ?? []).map((item: BranchFixedExpenseItem) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {periodLabel(item.period)} · {formatAmount(item.amount ?? 0)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      disabled={deleteFixedExpenseMutation.isPending}
                      onClick={() =>
                        deleteFixedExpenseMutation.mutate({
                          branchId: fixedExpenseBranchId,
                          expenseId: item.id,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          )
        ) : null}
      </div>

      <DashboardFilterBar>
        <div className={cn(DASHBOARD_FILTER_FIELD, "min-w-[10rem] sm:w-[11rem]")}>
          <label className={DASHBOARD_FILTER_LABEL}>Tür</label>
          <SearchableSelect
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value as TypeFilter);
              setPage(0);
            }}
            options={[
              { value: "all", label: "Tümü" },
              { value: "GELIR", label: "Gelir" },
              { value: "GIDER", label: "Gider" },
              { value: "BORC", label: "Borç" },
            ]}
            placeholder="Tür seçin"
            searchPlaceholder="Tür ara..."
          />
        </div>
        <DateRangeFilter
          value={{ from, to }}
          onChange={(next) => {
            setFrom(next.from);
            setTo(next.to);
            setPage(0);
          }}
        />
        <div className={cn(DASHBOARD_FILTER_FIELD, "min-w-[12rem] flex-1 sm:max-w-xs")}>
          <label className={DASHBOARD_FILTER_LABEL}>Ara</label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={q}
            placeholder="Başlık veya not"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </DashboardFilterBar>

      <div className={`${DASHBOARD_PANEL} space-y-4`}>
          {listQuery.isLoading ? (
            <DashboardLoadingState label="Kayıtlar yükleniyor…" />
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Bu filtrelerle kayıt yok.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tarih</th>
                    <th className="px-4 py-3 font-medium">Tür</th>
                    <th className="px-4 py-3 font-medium">Başlık</th>
                    <th className="px-4 py-3 font-medium">Tutar</th>
                    <th className="px-4 py-3 font-medium">Menü</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <AccountingRow
                      key={item.id}
                      item={item}
                      onOpen={() => setDetailItem(item)}
                      onDelete={
                        item.sourceType === "MANUAL"
                          ? () => deleteMutation.mutate(item.id)
                          : undefined
                      }
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Önceki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entryTypeLabel(dialogType)} Gir</DialogTitle>
            <DialogDescription>
              {dialogType === "GELIR"
                ? "Gelir kaydı oluşturun. İsterseniz hangi menüden geldiğini seçebilirsiniz."
                : dialogType === "GIDER"
                  ? "Tek seferlik veya şube bazlı sabit gider kaydı oluşturun."
                  : `${entryTypeLabel(dialogType)} kaydı oluşturun.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {dialogType === "GIDER" ? (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Gider türü</label>
                <div className="inline-flex w-full gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                      expenseMode === "ONE_TIME"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                        : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                    )}
                    onClick={() => setExpenseMode("ONE_TIME")}
                  >
                    Tek seferlik
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                      expenseMode === "FIXED"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                        : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                    )}
                    onClick={() => setExpenseMode("FIXED")}
                  >
                    Sabit
                  </button>
                </div>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Başlık</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Kira ödemesi"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tutar (₺)</label>
              <MoneyInput value={amount} onChange={setAmount} placeholder="0,00" />
            </div>
            {dialogType === "GIDER" && expenseMode === "FIXED" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Şube</label>
                  <BranchPicker
                    className="h-10 w-full justify-between px-3 text-sm font-normal"
                    branches={branches}
                    selectedBranchId={dialogBranchId ?? fixedExpenseBranchId}
                    onSelect={(branchId) => {
                      setDialogBranchId(branchId);
                      selectFixedExpenseBranch(branchId);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Periyot</label>
                  <SearchableSelect
                    value={expensePeriod}
                    onValueChange={(value) => setExpensePeriod(value as FixedExpensePeriod)}
                    options={[
                      { value: "DAILY", label: "Günlük" },
                      { value: "WEEKLY", label: "Haftalık" },
                      { value: "MONTHLY", label: "Aylık" },
                      { value: "YEARLY", label: "Yıllık" },
                    ]}
                    placeholder="Periyot seçin"
                    searchPlaceholder="Periyot ara..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">İşlem tarihi</label>
                <DateTimePicker value={occurredAt} onChange={setOccurredAt} />
              </div>
            )}
            {!(dialogType === "GIDER" && expenseMode === "FIXED") ? (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Not (opsiyonel)</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : null}
            {dialogType === "GELIR" && canUseDigitalMenu && menuQrs.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Menü (opsiyonel)</label>
                <DigitalMenuPicker
                  compact
                  menuQrs={menuQrs}
                  selectedQrId={
                    formMenuId != null
                      ? menuQrs.find((item) => item.menuId === formMenuId)?.id ?? null
                      : null
                  }
                  onSelectQrId={(qrId) => {
                    const menuQr = menuQrs.find((item) => item.id === qrId);
                    setFormMenuId(menuQr?.menuId ?? null);
                  }}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button disabled={saving} onClick={handleSubmit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccountingEntryDetailDialog
        item={detailItem}
        deleting={deleteMutation.isPending}
        onDelete={
          detailItem?.sourceType === "MANUAL"
            ? () => deleteMutation.mutate(detailItem.id)
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setDetailItem(null);
        }}
      />
    </div>
  );
}

function AccountingRow({
  item,
  onOpen,
  onDelete,
  deleting,
}: {
  item: AccountingEntryApiItem;
  onOpen: () => void;
  onDelete?: () => void;
  deleting: boolean;
}) {
  return (
    <tr
      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
      onClick={onOpen}
    >
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.occurredAt)}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${entryTypeClass(item.entryType)}`}
        >
          {entryTypeLabel(item.entryType)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-foreground">{item.title}</p>
          {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
        </div>
      </td>
      <td className="px-4 py-3 font-medium">{formatAmount(item.amount, item.currency)}</td>
      <td className="px-4 py-3 text-muted-foreground">{item.menuName ?? "—"}</td>
      <td className="px-4 py-3 text-right">
        {onDelete ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Kaydı sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted px-3 py-2.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AccountingEntryDetailDialog({
  item,
  onOpenChange,
  onDelete,
  deleting,
}: {
  item: AccountingEntryApiItem | null;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const loadLines = item ? canLoadEntryLines(item) : false;
  const detailQuery = useQuery({
    queryKey: ["accounting-entry-detail", item?.id],
    queryFn: () => getAccountingEntryDetailRequest(item!.id),
    enabled: item != null && loadLines,
  });
  const lines = detailQuery.data?.items ?? [];
  const currency = detailQuery.data?.currency ?? item?.currency ?? "TRY";

  return (
    <Dialog open={item != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border sm:max-w-lg">
        {item ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-6">
                <DialogTitle>{item.title}</DialogTitle>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${entryTypeClass(item.entryType)}`}
                >
                  {entryTypeLabel(item.entryType)}
                </span>
              </div>
              <DialogDescription>
                {formatAmount(item.amount, item.currency)} · {formatDateTime(item.occurredAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 sm:grid-cols-2">
              <DetailField label="Kaynak" value={sourceTypeLabel(item.sourceType)} />
              <DetailField label="Menü" value={item.menuName ?? "—"} />
              {item.sourceOrderId != null ? (
                <DetailField label="Sipariş" value={`#${item.sourceOrderId}`} />
              ) : null}
              {item.sourceBillId != null ? (
                <DetailField label="Adisyon" value={`#${item.sourceBillId}`} />
              ) : null}
              {item.note ? <DetailField label="Not" value={item.note} /> : null}
            </div>

            {loadLines ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kalemler
                </p>
                {detailQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Detay yükleniyor…
                  </div>
                ) : detailQuery.isError ? (
                  <p className="text-sm text-destructive">Detay yüklenemedi.</p>
                ) : lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu kayıt için sipariş/adisyon kalemi yok.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-border bg-muted px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <span>Ürün</span>
                      <span>Tutar</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {lines.map((line) => (
                        <li key={line.id} className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{line.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {line.quantity} × {formatAmount(line.unitPrice, currency)}
                              {line.sourceOrderId != null &&
                              detailQuery.data?.sourceOrderId == null
                                ? ` · Sipariş #${line.sourceOrderId}`
                                : ""}
                            </p>
                            {line.note ? (
                              <p className="text-xs text-muted-foreground">{line.note}</p>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {formatAmount(line.lineTotal, currency)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter>
              {onDelete ? (
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={onDelete}
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sil
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
