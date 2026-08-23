import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getBranchRequest, listBranchesRequest } from "@/lib/branch";

export const BRANCHES_QUERY_KEY = ["branches"] as const;

export function useBranches(enabled = true) {
  return useQuery({
    queryKey: BRANCHES_QUERY_KEY,
    queryFn: listBranchesRequest,
    enabled,
  });
}

export function useBranch(branchId: number | null, enabled = true) {
  return useQuery({
    queryKey: [...BRANCHES_QUERY_KEY, branchId],
    queryFn: () => getBranchRequest(branchId as number),
    enabled: enabled && branchId != null && branchId > 0,
  });
}

export async function invalidateBranches(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
}
