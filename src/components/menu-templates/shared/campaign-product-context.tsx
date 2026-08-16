"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchCampaignProductIds } from "@/lib/public-campaign-api";

const CampaignProductIdsContext = createContext<Set<number>>(new Set());

type CampaignProductIdsProviderProps = {
  identifier: string;
  children: ReactNode;
};

export function CampaignProductIdsProvider({
  identifier,
  children,
}: CampaignProductIdsProviderProps) {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchCampaignProductIds(identifier).then((next) => {
      if (!cancelled) setIds(next);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  const value = useMemo(() => new Set(ids), [ids]);

  return (
    <CampaignProductIdsContext.Provider value={value}>
      {children}
    </CampaignProductIdsContext.Provider>
  );
}

export function useCampaignProductIds(): Set<number> {
  return useContext(CampaignProductIdsContext);
}

export function useIsCampaignProduct(productId: number): boolean {
  const ids = useCampaignProductIds();
  return ids.has(productId);
}
