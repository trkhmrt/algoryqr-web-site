import { proxyCustomerAuthenticatedRequest } from "@/lib/server/customer-authenticated-proxy";

export async function GET(request: Request) {
  return proxyCustomerAuthenticatedRequest(request, "/customer/auth/me", "GET");
}
