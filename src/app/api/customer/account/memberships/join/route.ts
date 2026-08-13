import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

export async function POST(request: Request) {
  return proxyCustomerAuthenticatedRequest(request, "/customer/account/memberships/join", "POST");
}
