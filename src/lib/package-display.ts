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

function isValidityFeature(feature: string): boolean {
  const f = feature.toLowerCase();
  return f.includes("geçerlilik") || f.includes("gecerlilik");
}

export function packageFeatures(pkg: PlanPackageApiItem): string[] {
  const fromAdmin = (pkg.features ?? [])
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => !isValidityFeature(f));
  if (fromAdmin.length > 0) {
    return fromAdmin;
  }

  const qrItem = findPackageItem(pkg, "QR_CREATE");
  const menuItem = findPackageItem(pkg, "QR_MENU");
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
  for (const code of ["SMART_SUMMARY", "SMART_ASSISTANT", "SMART_REPORTING"] as const) {
    if (findPackageItem(pkg, code)) {
      features.push(productDisplayName(code));
    }
  }
  if (pkg.description?.trim()) {
    features.push(pkg.description.trim());
  }
  return features.length > 0 ? features : ["Paket detayları için destek ile iletişime geçin"];
}

export function collectCatalogFeatures(packages: PlanPackageApiItem[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const pkg of packages) {
    for (const feature of packageFeatures(pkg)) {
      const key = feature.trim();
      if (!key || seen.has(key)) continue;
      if (key.toLowerCase().includes("yok")) continue;
      seen.add(key);
      ordered.push(key);
    }
  }
  return ordered;
}

export function packageHasFeature(pkg: PlanPackageApiItem, feature: string): boolean {
  const needle = feature.trim().toLowerCase();
  return packageFeatures(pkg).some((f) => f.trim().toLowerCase() === needle);
}

export function featureTooltip(feature: string): string {
  const f = feature.toLowerCase();
  if (f.includes("qr oluştur") || f.includes("qr olustur"))
    return "Bu paketle oluşturabileceğiniz dinamik QR kod adedini belirtir.";
  if (f.includes("menü") || f.includes("menu"))
    return "Dijital menü oluşturma, şablon seçimi ve yayınlama imkânı.";
  if (f.includes("asistan") || f.includes("agent"))
    return "Menüdeki misafirlere yapay zeka ile öneri ve yanıt sunan Akıllı Asistan.";
  if (f.includes("rapor") || f.includes("analitik"))
    return "Ziyaret ve ürün ilgisine dayalı Akıllı Raporlama ile performans özetleri.";
  if (f.includes("geçerlilik") || f.includes("gecerlilik"))
    return "Paketin aktif kalacağı süre.";
  if (f.includes("fiyat")) return "Paketin listelenen satış fiyatı.";
  if (f.includes("deneme")) return "Bu paket için deneme sürümü başlatılabilir mi?";
  if (f.includes("özet") || f.includes("ozet"))
    return "Ürün açıklamalarını yapay zeka ile hızlıca üreten Akıllı Özet.";
  if (f.includes("temel")) return "Temel kullanım ve temel özelliklere erişim.";
  return "Bu paketin ilgili ürünü hakkında kısa bilgi.";
}

export type ComparisonRow = {
  id: string;
  label: string;
  values: Record<string, string>;
  kind?: "text" | "bool" | "qty";
};

const PRODUCT_ORDER = [
  "QR_CREATE",
  "SMART_ASSISTANT",
  "SMART_SUMMARY",
  "SMART_REPORTING",
] as const;

const PRODUCT_CODE_ALIASES: Record<string, readonly string[]> = {
  SMART_ASSISTANT: ["SMART_ASSISTANT", "QR_AGENT"],
  SMART_REPORTING: ["SMART_REPORTING", "QR_ANALYTICS"],
  SMART_SUMMARY: ["SMART_SUMMARY"],
  QR_CREATE: ["QR_CREATE"],
  QR_MENU: ["QR_MENU"],
};

function packageKey(pkg: PlanPackageApiItem): string {
  return String(pkg.id);
}

function productDisplayName(code: string): string {
  switch (code) {
    case "QR_CREATE":
      return "QR oluşturma";
    case "QR_MENU":
      return "Dijital menü";
    case "SMART_ASSISTANT":
      return "Akıllı Asistan";
    case "SMART_SUMMARY":
      return "Akıllı Özet";
    case "SMART_REPORTING":
      return "Akıllı Raporlama";
    default:
      return code;
  }
}

function isQuantityProduct(code: string): boolean {
  return code === "QR_CREATE";
}

function findPackageItem(pkg: PlanPackageApiItem, productCode: string) {
  const aliases = PRODUCT_CODE_ALIASES[productCode] ?? [productCode];
  return pkg.items?.find(
    (i) =>
      aliases.includes(i.productCode) &&
      (i.unlimited || i.quantity > 0),
  );
}

function productCellValue(
  pkg: PlanPackageApiItem,
  productCode: string,
): { value: string; kind: "qty" | "bool" } {
  const item = findPackageItem(pkg, productCode);
  if (!item) {
    return { value: "Yok", kind: "bool" };
  }
  if (isQuantityProduct(productCode)) {
    if (item.unlimited) return { value: "Sınırsız", kind: "qty" };
    return { value: `${item.quantity} adet`, kind: "qty" };
  }
  return { value: "Var", kind: "bool" };
}

export function buildPackageComparisonRows(packages: PlanPackageApiItem[]): ComparisonRow[] {
  const keys = packages.map(packageKey);
  const emptyValues = (): Record<string, string> =>
    Object.fromEntries(keys.map((key) => [key, "—"]));

  const productRows: ComparisonRow[] = PRODUCT_ORDER.map((code) => {
    const values = emptyValues();
    const kind: "qty" | "bool" = isQuantityProduct(code) ? "qty" : "bool";
    for (const pkg of packages) {
      values[packageKey(pkg)] = productCellValue(pkg, code).value;
    }
    return {
      id: `product:${code}`,
      label: productDisplayName(code),
      values,
      kind,
    };
  });

  const validity = emptyValues();
  const price = emptyValues();
  const trialEligible = emptyValues();
  for (const pkg of packages) {
    const key = packageKey(pkg);
    validity[key] = pkg.validityDays > 0 ? `${pkg.validityDays} gün` : "—";
    price[key] = formatPackagePrice(pkg.price, pkg.currency);
    trialEligible[key] = pkg.trialEligible ? "Uygun" : "—";
  }

  return [
    ...productRows,
    { id: "validity", label: "Geçerlilik", values: validity, kind: "text" },
    { id: "price", label: "Fiyat", values: price, kind: "text" },
    { id: "trialEligible", label: "Deneme", values: trialEligible, kind: "text" },
  ];
}

export type PackageDiff = {
  gained: string[];
  lost: string[];
  same: string[];
  priceDelta: number;
  direction: "upgrade" | "downgrade" | "same";
};

export function packagePriority(pkg: PlanPackageApiItem | null | undefined): number {
  if (pkg == null) return -1;
  if (typeof pkg.priority === "number" && Number.isFinite(pkg.priority)) return pkg.priority;
  return Number(pkg.price) || 0;
}

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
  const fromPriority = packagePriority(current);
  const toPriority = packagePriority(target);
  const direction =
    toPriority > fromPriority ? "upgrade" : toPriority < fromPriority ? "downgrade" : "same";

  return { gained, lost, same, priceDelta, direction };
}

export function planActionLabel(
  currentPackageId: number | null | undefined,
  target: PlanPackageApiItem,
  currentPrice?: number | string | null,
  currentPurchaseType?: string | null,
): "Mevcut plan" | "Yükselt" | "Düşür" | "Satın al" | "Bu pakete geç" | null {
  if (currentPackageId != null && currentPackageId === target.id) {
    if (currentPurchaseType === "TRIAL") return "Satın al";
    return "Mevcut plan";
  }
  if (target.code === "FREE_PACKAGE") {
    return null;
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
