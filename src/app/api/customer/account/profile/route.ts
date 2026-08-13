import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

export async function GET(request: Request) {
  return proxyCustomerAuthenticatedRequest(request, "/customer/account/profile", "GET");
}

export async function PATCH(request: Request) {
  return proxyCustomerAuthenticatedRequest(request, "/customer/account/profile", "PATCH");
}
