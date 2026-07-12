import type { PlanPackageApiItem } from "@/lib/api";

export function formatPackagePrice(price: number | string, currency?: string): string {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(amount) || amount === 0) return "Ücretsiz";
  const symbol = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : "₺";
  return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

export function formatPackageDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export function packageFeatures(pkg: PlanPackageApiItem): string[] {
  const qrItem = pkg.items?.find((i) => i.productCode === "QR_CREATE");
  const features: string[] = [];
  if (qrItem) {
    features.push(`${qrItem.quantity} QR oluşturma hakkı`);
  }
  if (pkg.validityDays > 0) {
    features.push(`${pkg.validityDays} gün geçerlilik`);
  }
  if (pkg.description?.trim()) {
    features.push(pkg.description.trim());
  }
  return features.length > 0 ? features : ["Paket detayları için destek ile iletişime geçin"];
}
