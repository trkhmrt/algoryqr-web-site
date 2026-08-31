"use client";

import { useEffect } from "react";

type SyncTarget = {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

export function useSyncPublicMenuPage(target: SyncTarget) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = target;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
}
