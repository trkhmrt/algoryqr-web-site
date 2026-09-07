"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchActiveCampaigns,
  fetchCampaignProductIds,
  type ActiveCampaign,
} from "@/lib/public-campaign-api";

const CampaignProductIdsContext = createContext<Set<number>>(new Set());
const ActiveCampaignsContext = createContext<ActiveCampaign[]>([]);

type CampaignProductIdsProviderProps = {
  identifier: string;
  children: ReactNode;
};

export function CampaignProductIdsProvider({
  identifier,
  children,
}: CampaignProductIdsProviderProps) {
  const [ids, setIds] = useState<number[]>([]);
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchCampaignProductIds(identifier),
      fetchActiveCampaigns(identifier),
    ]).then(([nextIds, nextCampaigns]) => {
      if (cancelled) return;
      setIds(nextIds);
      setCampaigns(nextCampaigns);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  const idSet = useMemo(() => new Set(ids), [ids]);

  return (
    <ActiveCampaignsContext.Provider value={campaigns}>
      <CampaignProductIdsContext.Provider value={idSet}>
        {children}
      </CampaignProductIdsContext.Provider>
    </ActiveCampaignsContext.Provider>
  );
}

export function useCampaignProductIds(): Set<number> {
  return useContext(CampaignProductIdsContext);
}

export function useIsCampaignProduct(productId: number): boolean {
  const ids = useCampaignProductIds();
  return ids.has(productId);
}

export function useActiveCampaigns(): ActiveCampaign[] {
  return useContext(ActiveCampaignsContext);
}
