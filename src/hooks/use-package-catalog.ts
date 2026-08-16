"use client";

import { useMemo } from "react";

import { useEligibleTrialPackages } from "@/hooks/use-commerce";
import { useActivePackages, useSubscription } from "@/hooks/use-subscription";
import type { PlanPackageApiItem } from "@/lib/api";
import { buildPackageComparisonRows, filterCatalogPackages } from "@/lib/package-display";

function sortedPackages(packages: PlanPackageApiItem[]): PlanPackageApiItem[] {
  return [...packages].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
}

export function usePackageCatalog() {
  const subscription = useSubscription();
  const packagesQuery = useActivePackages();
  const eligibleTrials = useEligibleTrialPackages();

  const packages = useMemo(
    () => sortedPackages(filterCatalogPackages(packagesQuery.data ?? [])),
    [packagesQuery.data],
  );

  const rows = useMemo(() => buildPackageComparisonRows(packages), [packages]);
  const featureRows = useMemo(
    () => rows.filter((row) => !["price", "validity", "trialEligible"].includes(row.id)),
    [rows],
  );

  const isLoading = packagesQuery.isLoading || (packagesQuery.isFetching && packages.length === 0);

  return {
    subscription,
    packagesQuery,
    eligibleTrials,
    packages,
    featureRows,
    isLoading,
    isError: packagesQuery.isError,
    error: packagesQuery.error,
  };
}
