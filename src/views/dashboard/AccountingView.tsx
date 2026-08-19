"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuOptions,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ApiError,
  createAccountingEntryRequest,
  createMenuFixedExpenseRequest,
  deleteAccountingEntryRequest,
  deleteMenuFixedExpenseRequest,
  listAccountingEntriesRequest,
  listMenuFixedExpensesRequest,
  type AccountingEntryApiItem,
  type AccountingEntryType,
  type AccountingSourceType,
  type MenuFixedExpenseItem,
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

function sourceTypeLabel(source: AccountingSourceType): string {
  switch (source) {
    case "MANUAL":
      return "Manuel";
    case "BILL_SALE":
      return "Adisyon satışı";
    case "BILL_TIP":
      return "Bahşiş";
    case "ORDER_SALE":
      return "Sipariş cirosu";
    default:
      return source;
  }
}

export default function AccountingView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();

  const { canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs } = useDigitalMenuOptions(canUseDigitalMenu);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<AccountingEntryType>("GELIR");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(toLocalInputValue());
  const [note, setNote] = useState("");
  const [formMenuId, setFormMenuId] = useState<number | null>(null);
  const [fixedExpenseQrId, setFixedExpenseQrId] = useState<number | null>(null);
  const fixedExpenseMenuId =
    fixedExpenseQrId != null
      ? menuQrs.find((item) => item.id === fixedExpenseQrId)?.menuId ?? null
      : null;
  const [fixedExpenseTitle, setFixedExpenseTitle] = useState("");
  const [fixedExpenseAmount, setFixedExpenseAmount] = useState("");

  const fixedExpenseQuery = useQuery({
    queryKey: ["menu-fixed-expenses", fixedExpenseMenuId],
    queryFn: () => listMenuFixedExpensesRequest(fixedExpenseMenuId as number),
    enabled: fixedExpenseMenuId != null,
  });

  const createFixedExpenseMutation = useMutation({
    mutationFn: (payload: { menuId: number; title: string; dailyAmount: number }) =>
      createMenuFixedExpenseRequest(payload.menuId, {
        title: payload.title,
        dailyAmount: payload.dailyAmount,
        active: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-fixed-expenses"] });
      setFixedExpenseTitle("");
      setFixedExpenseAmount("");
      notify("info", "Sabit gider eklendi.");
    },
    onError: (err) => {
      notify("danger", err instanceof ApiError ? err.message : "Sabit gider eklenemedi.");
    },
  });

  const deleteFixedExpenseMutation = useMutation({
    mutationFn: (payload: { menuId: number; expenseId: number }) =>
      deleteMenuFixedExpenseRequest(payload.menuId, payload.expenseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu-fixed-expenses"] });
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
  }

  function openDialog(entryType: AccountingEntryType) {
    setDialogType(entryType);
    resetForm();
    setDialogOpen(true);
  }

  function handleSubmit() {
    const parsedAmount = Number(amount.replace(",", "."));
    if (!title.trim()) {
      notify("danger", "Başlık zorunludur.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01) {
      notify("danger", "Geçerli bir tutar girin.");
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Muhasebe</h1>
          <p className="text-sm text-muted-foreground">
            Gelir, gider ve borç kayıtlarınızı takip edin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openDialog("GELIR")}>Gelir Gir</Button>
          <Button variant="outline" onClick={() => openDialog("GIDER")}>
            Gider Gir
          </Button>
          <Button variant="outline" onClick={() => openDialog("BORC")}>
            Borç Gir
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Sabit giderler</h2>
            <p className="text-xs text-muted-foreground">
              Günlük sabit giderler ciro raporunda otomatik düşülür.
            </p>
          </div>
          <DigitalMenuPicker
            menuQrs={menuQrs}
            selectedQrId={fixedExpenseQrId}
            onSelectQrId={setFixedExpenseQrId}
          />
          {fixedExpenseMenuId != null ? (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <input
                  type="text"
                  placeholder="Gider adı (ör. Kira, Personel)"
                  className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={fixedExpenseTitle}
                  onChange={(e) => setFixedExpenseTitle(e.target.value)}
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Günlük tutar"
                  className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={fixedExpenseAmount}
                  onChange={(e) => setFixedExpenseAmount(e.target.value)}
                />
                <Button
                  disabled={createFixedExpenseMutation.isPending}
                  onClick={() => {
                    const parsed = Number(fixedExpenseAmount.replace(",", "."));
                    if (!fixedExpenseTitle.trim()) {
                      notify("danger", "Başlık zorunludur.");
                      return;
                    }
                    if (!Number.isFinite(parsed) || parsed < 0.01) {
                      notify("danger", "Geçerli günlük tutar girin.");
                      return;
                    }
                    createFixedExpenseMutation.mutate({
                      menuId: fixedExpenseMenuId,
                      title: fixedExpenseTitle.trim(),
                      dailyAmount: parsed,
                    });
                  }}
                >
                  Ekle
                </Button>
              </div>
              {fixedExpenseQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {(fixedExpenseQuery.data ?? []).length === 0 ? (
                    <li className="px-4 py-3 text-sm text-muted-foreground">Sabit gider yok.</li>
                  ) : (
                    (fixedExpenseQuery.data ?? []).map((item: MenuFixedExpenseItem) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Günlük {formatAmount(item.dailyAmount ?? 0)}
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
                              menuId: fixedExpenseMenuId,
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
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] space-y-1.5">
              <label className="text-xs text-muted-foreground">Tür</label>
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
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Başlangıç</label>
              <input
                type="date"
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Bitiş</label>
              <input
                type="date"
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Ara</label>
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
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Kayıtlar yükleniyor…
            </div>
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
                    <th className="px-4 py-3 font-medium">Kaynak</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <AccountingRow
                      key={item.id}
                      item={item}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entryTypeLabel(dialogType)} Gir</DialogTitle>
            <DialogDescription>
              {dialogType === "GELIR"
                ? "Gelir kaydı oluşturun. İsterseniz hangi menüden geldiğini seçebilirsiniz."
                : `${entryTypeLabel(dialogType)} kaydı oluşturun.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">İşlem tarihi</label>
              <input
                type="datetime-local"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Not (opsiyonel)</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
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
            <Button disabled={createMutation.isPending} onClick={handleSubmit}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountingRow({
  item,
  onDelete,
  deleting,
}: {
  item: AccountingEntryApiItem;
  onDelete?: () => void;
  deleting: boolean;
}) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.occurredAt)}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${entryTypeClass(item.entryType)}`}
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
      <td className="px-4 py-3 text-muted-foreground">{sourceTypeLabel(item.sourceType)}</td>
      <td className="px-4 py-3 text-right">
        {onDelete ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            onClick={onDelete}
            aria-label="Kaydı sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
