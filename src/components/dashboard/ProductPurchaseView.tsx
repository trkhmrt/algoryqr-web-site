"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import PaymentCheckoutOverlay, {
  type PaymentCheckoutOverlayContent,
} from "@/components/dashboard/PaymentCheckoutOverlay";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { useBillingAddresses } from "@/hooks/use-commerce";
import { usePurchaseFulfillment } from "@/hooks/use-purchase-fulfillment";
import { ApiError } from "@/lib/api";
import { checkoutSchema, displayBillingName, resolveIdentityNumber, type BillingAddress } from "@/lib/commerce";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { isPaytrCheckout, paytrCheckoutHtml } from "@/lib/paytr-checkout";
import {
  storePendingPurchaseId,
  type PurchaseInitiateResponse,
} from "@/lib/purchase-fulfillment";
import { refreshAccessAfterEntitlementChange } from "@/lib/refresh-access";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";

type CatalogProduct = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  unitPrice: number | string;
  vatRate: number | string;
};

type ProductPurchaseViewProps = {
  productCode: string;
  onNotify: (type: "info" | "warning" | "danger", message: string) => void;
};

const PRODUCT_LABELS: Record<string, string> = {
  QR_BRANCH: "Ek şube",
  QR_MENU: "Ek menü",
};

export default function ProductPurchaseView({ productCode, onNotify }: ProductPurchaseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addresses = useBillingAddresses();
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [paymentOverlay, setPaymentOverlay] = useState<PaymentCheckoutOverlayContent | null>(null);
  const addressInitialized = useRef(false);
  const fulfillment = usePurchaseFulfillment(purchaseId, pollStartedAt);
  const productQuery = useQuery({
    queryKey: ["catalog-product", productCode],
    queryFn: async () => {
      const { data } = await getSiteSameOriginAxios().get<CatalogProduct>(
        `/products/${encodeURIComponent(productCode)}`,
      );
      return data;
    },
  });

  useEffect(() => {
    if (addressInitialized.current || !addresses.data?.length) return;
    setBillingAddressId(addresses.data.find((item) => item.defaultAddress)?.id ?? addresses.data[0].id);
    addressInitialized.current = true;
  }, [addresses.data]);

  useEffect(() => {
    if (fulfillment.data?.status === "ACTIVE") {
      void refreshAccessAfterEntitlementChange(queryClient);
      onNotify("info", "Satın alma tamamlandı.");
      router.push(DASHBOARD_ROUTES.digitalMenu);
    }
  }, [fulfillment.data?.status, onNotify, queryClient, router]);

  const pay = async () => {
    const checkout = checkoutSchema.safeParse({
      billingPeriod: "MONTHLY",
      billingAddressId,
      recurringConsent: false,
    });
    if (!checkout.success) {
      onNotify("warning", checkout.error.issues[0]?.message ?? "Fatura adresini seçin.");
      return;
    }
    const selectedAddress = addresses.data?.find((item) => item.id === billingAddressId);
    setIsPaying(true);
    try {
      const response = await getSiteSameOriginAxios().post<PurchaseInitiateResponse>("/purchases/addons", {
        productCode,
        quantity: 1,
        billingAddressId,
        identityNumber: resolveIdentityNumber(selectedAddress?.tckn, selectedAddress?.vkn),
      });
      if (!Number.isSafeInteger(response.data.purchaseId) || response.data.purchaseId <= 0) {
        throw new Error("Satın alım kimliği alınamadı.");
      }
      storePendingPurchaseId(response.data.purchaseId);
      setPurchaseId(response.data.purchaseId);
      setPollStartedAt(Date.now());
      if (response.data.paymentPageUrl) {
        setPaymentOverlay({ kind: "url", content: response.data.paymentPageUrl });
      } else if (response.data.checkoutFormContent) {
        setPaymentOverlay({
          kind: "html",
          content: paytrCheckoutHtml(response.data.checkoutFormContent),
        });
      } else {
        throw new Error("Güvenli ödeme sayfası alınamadı.");
      }
    } catch (error) {
      onNotify("danger", error instanceof ApiError ? error.message : "Ödeme işlemi tamamlanamadı.");
    } finally {
      setIsPaying(false);
    }
  };

  if (paymentOverlay) {
    return (
      <PaymentCheckoutOverlay
        overlay={paymentOverlay}
        purchaseId={purchaseId}
        title={isPaytrCheckout(paymentOverlay) ? "Güvenli Ödeme (PayTR)" : "Güvenli Ödeme"}
        onClose={() => setPaymentOverlay(null)}
      />
    );
  }

  const product = productQuery.data;
  const unitPrice = Number(product?.unitPrice ?? 0);
  const vatRate = Number(product?.vatRate ?? 20);
  const total = Number((unitPrice * (1 + vatRate / 100)).toFixed(2));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {PRODUCT_LABELS[productCode] ?? product?.name ?? "Ek ürün"}
          </h1>
          <p className="text-sm text-muted-foreground">{product?.description ?? "Ek hak satın alın."}</p>
        </div>
      </div>

      {productQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ürün yükleniyor…
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <p className="text-lg font-semibold">₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
          <div className="space-y-2">
            <SearchableSelect
              value={billingAddressId == null ? "" : String(billingAddressId)}
              onValueChange={(value) => setBillingAddressId(value ? Number(value) : null)}
              options={(addresses.data ?? []).map((item: BillingAddress) => ({
                value: String(item.id),
                label: displayBillingName(item),
              }))}
              placeholder="Fatura adresi seçin"
              searchPlaceholder="Adres ara..."
              emptyText="Adres bulunamadı."
            />
            <p className="text-xs text-muted-foreground">
              Adres eklemek için{" "}
              <Link href={DASHBOARD_ROUTES.accountBillingAddresses} className="underline underline-offset-2">
                fatura adresleri
              </Link>{" "}
              sayfasını kullanın.
            </p>
          </div>
          <Button variant="hero" disabled={isPaying || billingAddressId == null} onClick={() => void pay()}>
            {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ödemeye geç"}
          </Button>
        </div>
      )}
    </div>
  );
}
