"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useBranches } from "@/hooks/use-branches";
import type { BranchItem } from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const BRANCH_STORAGE_KEY = "algory_selected_waiter_branch_id";

function readStoredBranchId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = Number(window.sessionStorage.getItem(BRANCH_STORAGE_KEY));
  return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
}

function writeStoredBranchId(branchId: number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(BRANCH_STORAGE_KEY, String(branchId));
}

export function useBranchSelection(initialBranchId: number | null, enabled = true) {
  const branchesQuery = useBranches(enabled);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(initialBranchId);

  useEffect(() => {
    if (!enabled || branchesQuery.isLoading) return;
    if (branches.length === 0) {
      setBranchId(null);
      return;
    }
    if (initialBranchId != null && branches.some((item) => item.id === initialBranchId)) {
      setBranchId(initialBranchId);
      writeStoredBranchId(initialBranchId);
      return;
    }
    const stored = readStoredBranchId();
    const next =
      (stored != null && branches.some((item) => item.id === stored) ? stored : null) ??
      branches[0].id;
    setBranchId(next);
    writeStoredBranchId(next);
  }, [branches, branchesQuery.isLoading, enabled, initialBranchId]);

  const select = useCallback((nextBranchId: number) => {
    setBranchId(nextBranchId);
    writeStoredBranchId(nextBranchId);
  }, []);

  const selection = branches.find((item) => item.id === branchId) ?? null;

  return {
    branches,
    selection,
    branchId,
    loading: branchesQuery.isLoading,
    empty: !branchesQuery.isLoading && branches.length === 0,
    error: branchesQuery.error,
    select,
  };
}

export function BranchPicker({
  branches,
  selectedBranchId,
  onSelect,
  disabled,
}: {
  branches: BranchItem[];
  selectedBranchId: number | null;
  onSelect: (branchId: number) => void;
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

  return (
    <SearchableSelect
      className="h-9 min-w-[12rem] max-w-xs text-xs"
      value={selectedBranchId != null ? String(selectedBranchId) : ""}
      onValueChange={(next) => {
        const id = Number(next);
        if (Number.isFinite(id) && id > 0) onSelect(id);
      }}
      options={branches.map((item) => ({ value: String(item.id), label: item.name }))}
      placeholder="Şube seçin"
      searchPlaceholder="Şube ara..."
      emptyText="Şube bulunamadı."
      disabled={disabled}
    />
  );
}
