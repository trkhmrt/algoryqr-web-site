"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useBranches } from "@/hooks/use-branches";
import { getMenuByQrIdRequest } from "@/lib/api";
import type { BranchItem, BranchMenuSummary } from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const BRANCH_STORAGE_KEY = "algory_selected_report_branch_id";
const ALL_MENUS_VALUE = "all";

export type BranchReportSelection = {
  branch: BranchItem;
  menu: BranchMenuSummary | null;
};

function readStoredBranchId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = Number(window.sessionStorage.getItem(BRANCH_STORAGE_KEY));
  return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
}

function writeStoredBranchId(branchId: number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(BRANCH_STORAGE_KEY, String(branchId));
}

export function useBranchReportSelection(
  initialBranchId: number | null,
  initialQrId: number | null,
  enabled = true,
) {
  const branchesQuery = useBranches(enabled);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(initialBranchId);
  const [qrId, setQrId] = useState<number | null>(initialQrId);

  useEffect(() => {
    if (!enabled || branchesQuery.isLoading) return;
    if (branches.length === 0) {
      setBranchId(null);
      setQrId(null);
      return;
    }
    if (initialBranchId != null) {
      const branch = branches.find((item) => item.id === initialBranchId);
      if (branch) {
        setBranchId(branch.id);
        const match = initialQrId != null && branch.menus.some((menu) => menu.qrId === initialQrId);
        setQrId(match ? initialQrId : null);
        writeStoredBranchId(branch.id);
        return;
      }
    }
    if (initialQrId != null) {
      const byQr = branches.find((item) => item.menus.some((menu) => menu.qrId === initialQrId));
      if (byQr) {
        setBranchId(byQr.id);
        setQrId(initialQrId);
        writeStoredBranchId(byQr.id);
        return;
      }
      void getMenuByQrIdRequest(initialQrId)
        .then((menu) => {
          if (menu.branchId != null && branches.some((item) => item.id === menu.branchId)) {
            setBranchId(menu.branchId);
            setQrId(initialQrId);
            writeStoredBranchId(menu.branchId);
          }
        })
        .catch(() => undefined);
      return;
    }
    const stored = readStoredBranchId();
    const next =
      (stored != null && branches.some((item) => item.id === stored) ? stored : null) ??
      branches[0].id;
    setBranchId(next);
    setQrId(null);
    writeStoredBranchId(next);
  }, [branches, branchesQuery.isLoading, enabled, initialBranchId, initialQrId]);

  const selectedBranch = useMemo(
    () => (branchId != null ? branches.find((item) => item.id === branchId) ?? null : null),
    [branchId, branches],
  );

  const selectedMenu = useMemo(() => {
    if (selectedBranch == null || qrId == null) return null;
    return selectedBranch.menus.find((menu) => menu.qrId === qrId) ?? null;
  }, [qrId, selectedBranch]);

  const selection = useMemo<BranchReportSelection | null>(() => {
    if (!selectedBranch) return null;
    return { branch: selectedBranch, menu: selectedMenu };
  }, [selectedBranch, selectedMenu]);

  const select = useCallback((nextBranchId: number, nextQrId: number | null) => {
    setBranchId(nextBranchId);
    setQrId(nextQrId);
    writeStoredBranchId(nextBranchId);
  }, []);

  return {
    branches,
    selection,
    branchId,
    qrId,
    menuId: selectedMenu?.menuId ?? null,
    loading: branchesQuery.isLoading,
    empty: !branchesQuery.isLoading && branches.length === 0,
    select,
  };
}

export function BranchReportPicker({
  branches,
  selectedBranchId,
  selectedQrId,
  onSelect,
  disabled,
}: {
  branches: BranchItem[];
  selectedBranchId: number | null;
  selectedQrId: number | null;
  onSelect: (branchId: number, qrId: number | null) => void;
  disabled?: boolean;
}) {
  if (branches.length === 0) {
    return (
      <div className="min-w-[12rem] max-w-xs flex-1 text-sm text-muted-foreground">
        <Link href={DASHBOARD_ROUTES.branchCreate} className="text-primary hover:underline">
          Şube oluştur
        </Link>
      </div>
    );
  }

  const selectedBranch = branches.find((item) => item.id === selectedBranchId) ?? null;
  const menuOptions = [
    { value: ALL_MENUS_VALUE, label: "Tüm menüler" },
    ...(selectedBranch?.menus.map((menu) => ({
      value: String(menu.qrId),
      label: menu.businessName?.trim() || `Menü #${menu.menuId}`,
    })) ?? []),
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <span className="sr-only">Şube seçin</span>
      <SearchableSelect
        className="h-9 min-w-[12rem] max-w-xs text-xs"
        value={selectedBranchId != null ? String(selectedBranchId) : ""}
        onValueChange={(next) => {
          const id = Number(next);
          if (Number.isFinite(id) && id > 0) onSelect(id, null);
        }}
        options={branches.map((item) => ({ value: String(item.id), label: item.name }))}
        placeholder="Şube seçin"
        searchPlaceholder="Şube ara..."
        emptyText="Şube bulunamadı."
        disabled={disabled}
      />
      {selectedBranch != null && selectedBranch.menus.length > 0 ? (
        <SearchableSelect
          className="h-9 min-w-[12rem] max-w-xs text-xs"
          value={selectedQrId != null ? String(selectedQrId) : ALL_MENUS_VALUE}
          onValueChange={(next) => {
            if (selectedBranchId == null) return;
            if (next === ALL_MENUS_VALUE) {
              onSelect(selectedBranchId, null);
              return;
            }
            const id = Number(next);
            if (Number.isFinite(id) && id > 0) onSelect(selectedBranchId, id);
          }}
          options={menuOptions}
          placeholder="Tüm menüler"
          searchPlaceholder="Menü ara..."
          emptyText="Menü bulunamadı."
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
