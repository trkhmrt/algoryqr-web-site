import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

/**
 * Customer earned campaign rewards.
 *
 * Upstream path is provisional until qr-service finalizes the contract.
 * Expected: GET /customer/account/rewards?publicId=…
 * Alternative candidates (swap here when known):
 *   - /customer/rewards
 *   - /menu/public/{publicId}/campaigns/my-rewards
 */
export async function GET(request: Request) {
  return proxyCustomerAuthenticatedRequest(
    request,
    "/customer/account/rewards",
    "GET",
  );
}
