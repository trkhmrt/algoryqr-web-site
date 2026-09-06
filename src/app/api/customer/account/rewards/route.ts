import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

/** GET /customer/account/rewards - qr-service PR #90 contract. */
export async function GET(request: Request) {
  return proxyCustomerAuthenticatedRequest(
    request,
    "/customer/account/rewards",
    "GET",
  );
}
