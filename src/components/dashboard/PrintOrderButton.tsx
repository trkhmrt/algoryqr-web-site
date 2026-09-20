"use client";

import { useState, type MouseEvent } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import {
  enqueueKitchenPrintJob,
  enqueueMarketplacePrintJob,
} from "@/lib/printer-api";
import {
  kitchenOrderToReceipt,
  marketplaceOrderToReceipt,
  printReceiptInBrowser,
  type KitchenLikeOrder,
  type MarketplaceLikeOrder,
} from "@/lib/receipt-ticket";

type PrintOrderButtonProps =
  | {
      kind: "marketplace";
      source: "YEMEK_SEPETI" | "UBER_EATS";
      order: MarketplaceLikeOrder;
    }
  | {
      kind: "kitchen";
      order: KitchenLikeOrder;
    };

export function PrintOrderButton(props: PrintOrderButtonProps) {
  const { notify } = useDashboardBanners();
  const [busy, setBusy] = useState(false);

  async function onPrint(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    try {
      if (props.kind === "marketplace") {
        await enqueueMarketplacePrintJob(props.source, props.order);
        notify("info", "Fiş kuyruğa alındı. Ajan bağlıysa yazıcı basacak.");
      } else {
        await enqueueKitchenPrintJob(props.order);
        notify("info", "Fiş kuyruğa alındı. Ajan bağlıysa yazıcı basacak.");
      }
    } catch (error) {
      const payload =
        props.kind === "marketplace"
          ? marketplaceOrderToReceipt(props.order, props.source)
          : kitchenOrderToReceipt(props.order);
      printReceiptInBrowser(payload);
      notify(
        "info",
        error instanceof ApiError
          ? `${error.message} Tarayıcı yazdırma açıldı.`
          : "Kuyruk başarısız. Tarayıcı yazdırma açıldı.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onPrint}>
      <Printer className="mr-1.5 h-3.5 w-3.5" />
      Fiş bas
    </Button>
  );
}
