import type { PlanPackageApiItem } from "@/lib/api";
import type { BillingPeriod } from "@/lib/commerce";
import { getProductHint, getProductHintByCode } from "@/lib/product-hints";

/** Geçici olarak katalog ve satın alma ekranlarında gizlenen paket kodları. */
export const CATALOG_HIDDEN_PACKAGE_CODES: ReadonlySet<string> = new Set(["PRO_PACKAGE"]);

export function isPackageVisibleInCatalog(
  pkg: Pick<PlanPackageApiItem, "code" | "active">,
): boolean {
  if (pkg.active === false) return false;
  return !CATALOG_HIDDEN_PACKAGE_CODES.has(pkg.code);
}

export function filterCatalogPackages(packages: PlanPackageApiItem[]): PlanPackageApiItem[] {
  return packages.filter(isPackageVisibleInCatalog);
}

function money(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export type PackagePricing = {
  period: BillingPeriod;
  suffix: string;
  /** Seçilen periyot için ödenen tutar (kampanya indirimi uygulanmış). */
  amount: number;
  /** Üstü çizili karşılaştırma fiyatı (yıllık: 12× aylık; kampanya: liste fiyatı). */
  compareAmount: number | null;
  compareSuffix: string | null;
  /** Yıllık ödemede aylık faturalamaya göre tasarruf. */
  yearlySavings: number | null;
  /** monthlyDiscount / yearlyDiscount kampanya indirimi var mı */
  hasPromotionalDiscount: boolean;
};

function effectiveMonthlyPrice(pkg: PlanPackageApiItem): number {
  const list = money(pkg.price);
  const promo = money(pkg.monthlyDiscount);
  return money(pkg.effectiveMonthlyPrice ?? list - promo);
}

function effectiveYearlyPrice(pkg: PlanPackageApiItem): number {
  const list = money(pkg.yearlyPrice);
  if (list <= 0) return 0;
  const promo = money(pkg.yearlyDiscount);
  return money(pkg.effectiveYearlyPrice ?? list - promo);
}

export function resolvePackagePricing(
  pkg: PlanPackageApiItem,
  billingPeriod: BillingPeriod,
): PackagePricing {
  const monthlyAmount = effectiveMonthlyPrice(pkg);
  const yearlyAmount = effectiveYearlyPrice(pkg);
  const monthlyList = money(pkg.price);
  const yearlyList = money(pkg.yearlyPrice);
  const monthlyPromo = money(pkg.monthlyDiscount);
  const yearlyPromo = money(pkg.yearlyDiscount);

  if (billingPeriod === "YEARLY") {
    const annualIfMonthly = monthlyAmount * 12;
    const yearlySavings =
      yearlyAmount > 0 && annualIfMonthly > yearlyAmount ? annualIfMonthly - yearlyAmount : null;

    let compareAmount: number | null = null;
    if (yearlySavings != null) {
      compareAmount = annualIfMonthly;
    } else if (yearlyPromo > 0 && yearlyList > yearlyAmount) {
      compareAmount = yearlyList;
    }

    return {
      period: "YEARLY",
      suffix: "/ yıl",
      amount: yearlyAmount,
      compareAmount,
      compareSuffix: compareAmount != null ? "/ yıl" : null,
      yearlySavings,
      hasPromotionalDiscount: yearlyPromo > 0,
    };
  }

  return {
    period: "MONTHLY",
    suffix: "/ ay",
    amount: monthlyAmount,
    compareAmount: monthlyPromo > 0 && monthlyList > monthlyAmount ? monthlyList : null,
    compareSuffix: monthlyPromo > 0 ? "/ ay" : null,
    yearlySavings: null,
    hasPromotionalDiscount: monthlyPromo > 0,
  };
}

export function formatPackagePrice(price: number | string, currency?: string): string {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(amount) || amount === 0) return "Ücretsiz";
  const symbol = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : "₺";
  return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

export function formatYearlySavingsLabel(amount: number, currency?: string): string {
  return `Aylık ödemeye göre ${formatPackagePrice(amount, currency)} tasarruf`;
}

export function formatYearlySavingsBadge(
  amount: number,
  currency?: string,
  percent?: number | null,
): string {
  const savingsText = `${formatPackagePrice(amount, currency)} tasarruf`;
  if (percent != null && percent > 0) {
    return `%${percent} indirim ile ${savingsText}`;
  }
  return savingsText;
}

export function resolveYearlySavingsPercent(pricing: PackagePricing): number | null {
  if (pricing.yearlySavings == null || pricing.yearlySavings <= 0) return null;
  if (pricing.compareAmount == null || pricing.compareAmount <= 0) return null;
  return Math.round((pricing.yearlySavings / pricing.compareAmount) * 100);
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
  const branchItem = findPackageItem(pkg, "QR_BRANCH");
  const menuItem = findPackageItem(pkg, "QR_MENU");
  const features: string[] = [];
  if (qrItem) {
    features.push(
      qrItem.unlimited ? "Sınırsız QR oluşturma" : `${qrItem.quantity} QR oluşturma hakkı`,
    );
  }
  if (branchItem) {
    features.push(branchItem.unlimited ? "Sınırsız şube" : `${branchItem.quantity} ücretsiz şube`);
  }
  if (menuItem) {
    features.push("Şube başına 1 ücretsiz menü");
  } else {
    features.push("Dijital menü yok");
  }
  for (const code of [
    "SMART_REPORTING",
    "SMART_ASSISTANT",
    "SMART_SUMMARY",
    "CUSTOM_DESIGN",
    "WAITER_PANEL",
  ] as const) {
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

export function featureTooltip(feature: string, productCode?: string): string {
  if (productCode) {
    const hint = getProductHint(productCode);
    if (hint) return hint.description;
  }
  const f = feature.trim().toLowerCase();
  if (f.includes("qr oluştur") || f.includes("qr olustur"))
    return getProductHintByCode("QR_CREATE").description;
  if (f.includes("özel tasar") || f.includes("ozel tasar") || f.includes("custom design"))
    return getProductHintByCode("CUSTOM_DESIGN").description;
  if (f.includes("garson") || f.includes("waiter") || f.includes("sipariş panel") || f.includes("siparis panel"))
    return getProductHintByCode("WAITER_PANEL").description;
  if (f.includes("ürün hakk") || f.includes("urun hakk") || f.includes("menu urun"))
    return getProductHintByCode("MENU_PRODUCT").description;
  if (f.includes("menü") || f.includes("menu"))
    return getProductHintByCode("QR_MENU").description;
  if (f.includes("asistan") || f.includes("agent"))
    return getProductHintByCode("SMART_ASSISTANT").description;
  if (f.includes("rapor") || f.includes("analitik"))
    return getProductHintByCode("SMART_REPORTING").description;
  if (f.includes("geçerlilik") || f.includes("gecerlilik"))
    return "Paketin aktif kalacağı süre.";
  if (f.includes("fiyat")) return "Paketin listelenen satış fiyatı.";
  if (f.includes("deneme")) return "Bu paket için deneme sürümü başlatılabilir mi?";
  if (f.includes("özet") || f.includes("ozet"))
    return getProductHintByCode("SMART_SUMMARY").description;
  if (f.includes("temel")) return "Temel kullanım ve temel özelliklere erişim.";
  return "Bu paketin ilgili ürünü hakkında kısa bilgi.";
}

export type ComparisonRow = {
  id: string;
  label: string;
  productCode?: string;
  values: Record<string, string>;
  kind?: "text" | "bool" | "qty";
};

const PRODUCT_ORDER = [
  "QR_CREATE",
  "QR_BRANCH",
  "QR_MENU",
  "MENU_PRODUCT",
  "SMART_REPORTING",
  "SMART_ASSISTANT",
  "SMART_SUMMARY",
  "CUSTOM_DESIGN",
  "WAITER_PANEL",
] as const;

const PRODUCT_CODE_ALIASES: Record<string, readonly string[]> = {
  SMART_ASSISTANT: ["SMART_ASSISTANT", "QR_AGENT"],
  SMART_REPORTING: ["SMART_REPORTING", "QR_ANALYTICS"],
  SMART_SUMMARY: ["SMART_SUMMARY"],
  QR_CREATE: ["QR_CREATE"],
  QR_BRANCH: ["QR_BRANCH"],
  QR_MENU: ["QR_MENU"],
  MENU_PRODUCT: ["MENU_PRODUCT"],
  CUSTOM_DESIGN: ["CUSTOM_DESIGN"],
  WAITER_PANEL: ["WAITER_PANEL"],
};

function packageKey(pkg: PlanPackageApiItem): string {
  return String(pkg.id);
}

function productDisplayName(code: string): string {
  switch (code) {
    case "QR_CREATE":
      return "QR oluşturma";
    case "QR_BRANCH":
      return "Şube";
    case "QR_MENU":
      return "Dijital menü";
    case "SMART_ASSISTANT":
      return "Akıllı Asistan";
    case "SMART_SUMMARY":
      return "Akıllı Özet";
    case "SMART_REPORTING":
      return "Akıllı Raporlama";
    case "MENU_PRODUCT":
      return "Menü ürün hakkı";
    case "CUSTOM_DESIGN":
      return "Özel tasarım menü";
    case "WAITER_PANEL":
      return "Garson paneli";
    default:
      return code;
  }
}

function isQuantityProduct(code: string): boolean {
  return code === "QR_CREATE" || code === "QR_BRANCH" || code === "QR_MENU" || code === "MENU_PRODUCT";
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
      productCode: code,
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
    case "ADD_ON":
      return "Ek ürün";
    case "SYSTEM_GRANT":
      return "Sistem";
    default:
      return "Paket";
  }
}

export function addonProductLabel(packageCode?: string | null, packageName?: string | null): string {
  switch (packageCode) {
    case "QR_BRANCH":
      return "Ek şube";
    case "QR_MENU":
      return "Ek menü";
    case "QR_CREATE":
      return "Ek QR hakkı";
    case "MENU_PRODUCT":
      return "Ek menü ürünü";
    default:
      return packageName?.trim() || packageCode || "Ek ürün";
  }
}
