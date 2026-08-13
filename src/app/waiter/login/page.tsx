import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";
import WaiterLoginView from "@/views/waiter/WaiterLoginView";

export const metadata: Metadata = buildMetadata({
  title: "Sipariş Paneli Girişi",
  description: "Sipariş Paneline giriş yapın.",
  path: "/waiter/login",
  noIndex: true,
});

export default function WaiterLoginPage() {
  return <WaiterLoginView />;
}
