import type { QueryClient } from "@tanstack/react-query";

import { invalidateAccessProfile } from "@/hooks/use-access-profile";
import { invalidateSubscription } from "@/hooks/use-subscription";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

export async function refreshAccessAfterEntitlementChange(queryClient: QueryClient) {
  await getSiteSameOriginAxios().post("/auth/refresh");
  await Promise.all([
    invalidateAccessProfile(queryClient),
    invalidateSubscription(queryClient),
  ]);
}
