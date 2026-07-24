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

export function formatDaysUntilExpiry(days?: number | null): string {
  if (days == null || !Number.isFinite(days)) return "—";
  if (days < 0) return "Süresi doldu";
  if (days === 0) return "Bugün bitiyor";
  if (days === 1) return "1 gün kaldı";
  return `${days} gün kaldı`;
}

export function packageFeatures(pkg: PlanPackageApiItem): string[] {
  const fromAdmin = (pkg.features ?? [])
    .map((f) => f.trim())
    .filter(Boolean);
  if (fromAdmin.length > 0) {
    return fromAdmin;
  }

  const qrItem = pkg.items?.find((i) => i.productCode === "QR_CREATE");
  const menuItem = pkg.items?.find((i) => i.productCode === "QR_MENU");
  const features: string[] = [];
  if (qrItem) {
    features.push(
      qrItem.unlimited ? "Sınırsız QR oluşturma" : `${qrItem.quantity} QR oluşturma hakkı`,
    );
  }
  if (menuItem) {
    features.push(menuItem.unlimited || menuItem.quantity > 0 ? "Dijital menü" : "Dijital menü yok");
  } else {
    features.push("Dijital menü yok");
  }
  if (pkg.validityDays > 0) {
    features.push(`${pkg.validityDays} gün geçerlilik`);
  }
  if (pkg.description?.trim()) {
    features.push(pkg.description.trim());
  }
  return features.length > 0 ? features : ["Paket detayları için destek ile iletişime geçin"];
}

export type ComparisonRowId =
  | "qrCreate"
  | "qrMenu"
  | "validity"
  | "price"
  | "trialEligible";

export type ComparisonRow = {
  id: ComparisonRowId;
  label: string;
  values: Record<string, string>;
};

function packageKey(pkg: PlanPackageApiItem): string {
  return String(pkg.id);
}

function qrCreateLabel(pkg: PlanPackageApiItem): string {
  const item = pkg.items?.find((i) => i.productCode === "QR_CREATE");
  if (!item) return "—";
  if (item.unlimited) return "Sınırsız";
  return `${item.quantity} adet`;
}

function qrMenuLabel(pkg: PlanPackageApiItem): string {
  const item = pkg.items?.find((i) => i.productCode === "QR_MENU");
  if (!item) return "Yok";
  if (item.unlimited || item.quantity > 0) return "Var";
  return "Yok";
}

export function buildPackageComparisonRows(packages: PlanPackageApiItem[]): ComparisonRow[] {
  const keys = packages.map(packageKey);
  const emptyValues = (): Record<string, string> =>
    Object.fromEntries(keys.map((key) => [key, "—"]));

  const qrCreate = emptyValues();
  const qrMenu = emptyValues();
  const validity = emptyValues();
  const price = emptyValues();
  const trialEligible = emptyValues();

  for (const pkg of packages) {
    const key = packageKey(pkg);
    qrCreate[key] = qrCreateLabel(pkg);
    qrMenu[key] = qrMenuLabel(pkg);
    validity[key] = pkg.validityDays > 0 ? `${pkg.validityDays} gün` : "—";
    price[key] = formatPackagePrice(pkg.price, pkg.currency);
    trialEligible[key] = pkg.trialEligible ? "Uygun" : "—";
  }

  return [
    { id: "qrCreate", label: "QR oluşturma", values: qrCreate },
    { id: "qrMenu", label: "Dijital menü", values: qrMenu },
    { id: "validity", label: "Geçerlilik", values: validity },
    { id: "price", label: "Fiyat", values: price },
    { id: "trialEligible", label: "Deneme", values: trialEligible },
  ];
}

export type PackageDiff = {
  gained: string[];
  lost: string[];
  same: string[];
  priceDelta: number;
  direction: "upgrade" | "downgrade" | "same";
};

function featureSet(pkg: PlanPackageApiItem): Set<string> {
  return new Set(packageFeatures(pkg));
}

export function diffPackages(
  current: PlanPackageApiItem | null | undefined,
  target: PlanPackageApiItem,
): PackageDiff {
  const targetFeatures = packageFeatures(target);
  if (!current) {
    return {
      gained: targetFeatures,
      lost: [],
      same: [],
      priceDelta: Number(target.price) || 0,
      direction: "upgrade",
    };
  }

  const currentSet = featureSet(current);
  const targetSet = featureSet(target);
  const gained = targetFeatures.filter((f) => !currentSet.has(f));
  const lost = packageFeatures(current).filter((f) => !targetSet.has(f));
  const same = targetFeatures.filter((f) => currentSet.has(f));
  const priceDelta = (Number(target.price) || 0) - (Number(current.price) || 0);
  const direction =
    priceDelta > 0 ? "upgrade" : priceDelta < 0 ? "downgrade" : "same";

  return { gained, lost, same, priceDelta, direction };
}

export function planActionLabel(
  currentPackageId: number | null | undefined,
  target: PlanPackageApiItem,
  currentPrice?: number | string | null,
): "Mevcut plan" | "Yükselt" | "Düşür" | "Satın al" | "Bu pakete geç" {
  if (currentPackageId != null && currentPackageId === target.id) {
    return "Mevcut plan";
  }
  const from = Number(currentPrice ?? 0);
  const to = Number(target.price) || 0;
  if (!Number.isFinite(from) || from <= 0) {
    return "Satın al";
  }
  if (to > from) return "Yükselt";
  if (to < from) return "Düşür";
  return "Bu pakete geç";
}

export function purchaseTypeLabel(purchaseType?: string | null): string {
  switch (purchaseType) {
    case "TRIAL":
      return "Deneme";
    case "PAID":
      return "Ücretli";
    case "FREE":
      return "Free";
    default:
      return "Paket";
  }
}
