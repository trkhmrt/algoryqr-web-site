import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export default function GarsonRedirectPage() {
  redirect(DASHBOARD_ROUTES.waiterPanel);
}
