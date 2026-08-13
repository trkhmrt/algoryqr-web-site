import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";
import WaiterPanelView from "@/views/waiter/WaiterPanelView";

export const metadata: Metadata = buildMetadata({
  title: "Sipariş Paneli",
  description: "Bekleyen siparişler ve masa takibi.",
  path: "/waiter",
  noIndex: true,
});

export default function WaiterPanelPage() {
  return <WaiterPanelView />;
}
