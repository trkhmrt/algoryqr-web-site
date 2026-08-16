"use client";

import { Skeleton } from "@/components/ui/skeleton";

const FEATURE_SKELETON_ROWS = 8;

function PackageCardSkeleton() {
  return (
    <div className="smart-feature-panel flex h-full flex-col">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#e5e7eb] pt-4 dark:border-border">
        {Array.from({ length: FEATURE_SKELETON_ROWS }).map((_, index) => (
          <li key={index} className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[12rem]" />
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
      <Skeleton className="mt-5 h-10 w-full rounded-md" />
    </div>
  );
}

export function PackageComparisonCurrentPlanSkeleton() {
  return (
    <div className="smart-feature-panel">
      <div className="flex min-w-0 items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

export function PackageComparisonSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-6 w-11 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[720px]:grid-cols-3 min-[720px]:gap-3 lg:gap-4 xl:gap-5">
        {Array.from({ length: cardCount }).map((_, index) => (
          <PackageCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function PackageComparisonPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <PackageComparisonCurrentPlanSkeleton />
      <PackageComparisonSkeleton />
    </div>
  );
}
