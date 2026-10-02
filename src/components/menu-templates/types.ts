import type { MenuVisitAnalytics } from "@/hooks/use-menu-visit-analytics";
import type {
  MainCategoryApiItem,
  MenuProductApiItem,
  MenuProfileApiItem,
  SubCategoryApiItem,
} from "@/lib/api";

export type MenuTemplateProps = {
  menu: MenuProfileApiItem;
  products: MenuProductApiItem[];
  categories?: MainCategoryApiItem[];
  analytics?: MenuVisitAnalytics;
};

export type MenuTemplateRendererProps = MenuTemplateProps & {
  themeId: string;
  /** Public menu QR identifier (path segment /menu/[identifier]). */
  identifier?: string;
  productPage?: number;
  productSize?: number;
  productTotalElements?: number;
  productHasNext?: boolean;
  categoryPage?: number;
  categorySize?: number;
  categoryTotalElements?: number;
  categoryHasNext?: boolean;
};

export type MenuNavCategory = {
  key: string;
  mainCategoryId: number | null;
  subCategoryId: number | null;
  name: string;
  depth: number;
};

export function flattenTaxonomyNav(categories: MainCategoryApiItem[] = []): MenuNavCategory[] {
  return categories.flatMap((main) => [
    {
      key: `main-${main.id}`,
      mainCategoryId: main.id,
      subCategoryId: null,
      name: main.name,
      depth: 0,
    },
    ...(main.subs ?? []).map((sub) => ({
      key: `sub-${sub.id}`,
      mainCategoryId: main.id,
      subCategoryId: sub.id,
      name: sub.name,
      depth: 1,
    })),
  ]);
}

export function resolveMenuNavCategories(
  categories: MainCategoryApiItem[] | undefined,
  products: MenuProductApiItem[],
): MenuNavCategory[] {
  const fromApi = flattenTaxonomyNav(categories ?? []);
  if (fromApi.length > 0) return fromApi;

  const seen = new Set<string>();
  const fromProducts: MenuNavCategory[] = [];
  for (const product of products) {
    const name = product.subCategoryName?.trim() || product.mainCategoryName?.trim() || "Genel";
    if (seen.has(name)) continue;
    seen.add(name);
    fromProducts.push({
      key: `name-${name.toLowerCase()}`,
      mainCategoryId: product.mainCategoryId ?? null,
      subCategoryId: product.subCategoryId ?? null,
      name,
      depth: 0,
    });
  }
  return fromProducts;
}

export function filterProductsByNavCategory(
  products: MenuProductApiItem[],
  category: MenuNavCategory | null,
): MenuProductApiItem[] {
  if (!category) return products;
  if (category.subCategoryId != null) {
    return products.filter((product) => product.subCategoryId === category.subCategoryId);
  }
  if (category.mainCategoryId != null) {
    return products.filter((product) => product.mainCategoryId === category.mainCategoryId);
  }
  return products;
}

export function findSubCategory(
  categories: MainCategoryApiItem[],
  subCategoryId: number,
): SubCategoryApiItem | null {
  for (const main of categories) {
    const found = (main.subs ?? []).find((sub) => sub.id === subCategoryId);
    if (found) return found;
  }
  return null;
}

export function findMainCategory(
  categories: MainCategoryApiItem[],
  mainCategoryId: number,
): MainCategoryApiItem | null {
  return categories.find((main) => main.id === mainCategoryId) ?? null;
}

export const MAIN_NAV_OFFSET = 1_000_000;

/** Nav `categoryId` in URLs is `MAIN_NAV_OFFSET + menu main category id`. */
export function mainNavCategoryId(mainCategoryId: number): number {
  return MAIN_NAV_OFFSET + mainCategoryId;
}

export function decodeMainNavCategoryId(categoryId: number): number | null {
  if (!Number.isFinite(categoryId) || categoryId < MAIN_NAV_OFFSET) return null;
  const mainCategoryId = categoryId - MAIN_NAV_OFFSET;
  return mainCategoryId > 0 ? mainCategoryId : null;
}

export type TaxonomyNavNode = {
  categoryId: number;
  name: string;
  slug?: string | null;
  parentId: number | null;
  sortOrder: number;
  kind: "main" | "sub";
  mainCategoryId: number;
  subCategoryId: number | null;
  imageUrl?: string | null;
  children: TaxonomyNavNode[];
};

export function taxonomyAsNavTree(mains: MainCategoryApiItem[] = []): TaxonomyNavNode[] {
  return mains.map((main) => {
    const mainNavId = MAIN_NAV_OFFSET + main.id;
    return {
      categoryId: mainNavId,
      name: main.name,
      slug: main.slug ?? null,
      parentId: null,
      sortOrder: main.sortOrder,
      kind: "main" as const,
      mainCategoryId: main.id,
      subCategoryId: null,
      imageUrl: main.imageUrl ?? null,
      children: (main.subs ?? []).map((sub) => ({
        categoryId: sub.id,
        name: sub.name,
        slug: sub.slug ?? null,
        parentId: mainNavId,
        sortOrder: sub.sortOrder,
        kind: "sub" as const,
        mainCategoryId: main.id,
        subCategoryId: sub.id,
        children: [],
      })),
    };
  });
}

function sameTaxonomyId(left?: number | null, right?: number | null): boolean {
  if (left == null || right == null) return false;
  return Number(left) === Number(right);
}


/** Canonical `categoryId` query value for a resolved nav node (DB id + offset for mains). */
export function publicMenuCategoryUrlId(category: TaxonomyNavNode): number {
  return category.categoryId;
}

/** Query param value when navigating by category label (human-readable name). */
export function publicMenuCategoryUrlName(category: TaxonomyNavNode): string {
  return category.name.trim();
}

export function normalizeMenuCategorySearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryNameLikeMatches(candidate: string, query: string): boolean {
  const normalizedCandidate = normalizeMenuCategorySearchText(candidate);
  const normalizedQuery = normalizeMenuCategorySearchText(query);
  if (!normalizedCandidate || !normalizedQuery) return false;
  if (normalizedCandidate === normalizedQuery) return true;
  return (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  );
}

function slugLikeMatches(slug: string | null | undefined, query: string): boolean {
  if (!slug?.trim()) return false;
  const slugAsWords = slug.replace(/_/g, " ");
  return categoryNameLikeMatches(slugAsWords, query);
}

/**
 * Resolve main category from a URL `category=` name (LIKE-style, Turkish-safe normalize).
 */
export function resolveMainCategoryByNameLike(
  categories: TaxonomyNavNode[],
  rawQuery: string,
): TaxonomyNavNode | null {
  const query = rawQuery.trim();
  if (!query) return null;

  const mains = categories.filter((node) => node.kind === "main");
  if (mains.length === 0) return null;

  const normalizedQuery = normalizeMenuCategorySearchText(query);

  const exact = mains.filter(
    (main) => normalizeMenuCategorySearchText(main.name) === normalizedQuery,
  );
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    return [...exact].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"),
    )[0]!;
  }

  const slugExact = mains.filter(
    (main) =>
      main.slug?.trim() &&
      normalizeMenuCategorySearchText(main.slug.replace(/_/g, " ")) === normalizedQuery,
  );
  if (slugExact.length === 1) return slugExact[0]!;

  const like = mains.filter(
    (main) =>
      categoryNameLikeMatches(main.name, query) || slugLikeMatches(main.slug, query),
  );
  if (like.length === 1) return like[0]!;
  if (like.length > 1) {
    return [...like].sort(
      (a, b) =>
        a.name.length - b.name.length ||
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name, "tr"),
    )[0]!;
  }

  return null;
}

function legacySortUrlId(main: TaxonomyNavNode): number {
  return MAIN_NAV_OFFSET + main.sortOrder;
}

function collectMainUrlAliases(main: TaxonomyNavNode): number[] {
  const canonical = main.categoryId;
  const legacy = legacySortUrlId(main);
  const ids = [canonical, main.mainCategoryId, legacy];
  return [...new Set(ids)];
}

function matchesMainUrlParam(main: TaxonomyNavNode, rawCategoryId: number): boolean {
  return collectMainUrlAliases(main).some((id) => sameTaxonomyId(id, rawCategoryId));
}

function pickMainFromUrlMatches(
  matches: TaxonomyNavNode[],
  rawCategoryId: number,
): TaxonomyNavNode {
  const exactNav = matches.find((main) => sameTaxonomyId(main.categoryId, rawCategoryId));
  if (exactNav) return exactNav;

  const legacy = matches.find((main) => sameTaxonomyId(legacySortUrlId(main), rawCategoryId));
  if (legacy) return legacy;

  const byDatabaseId = matches.find((main) =>
    sameTaxonomyId(main.mainCategoryId, rawCategoryId),
  );
  if (byDatabaseId) return byDatabaseId;

  return matches[0]!;
}

/**
 * Resolve `categoryId` from public menu URLs against the live taxonomy tree.
 * Supports canonical nav ids (offset + DB main id), raw DB main/sub ids, and
 * legacy links that used offset + sortOrder before DB ids were stable.
 */
export function resolveCategoryByUrlParam(
  categories: TaxonomyNavNode[],
  rawCategoryId: number,
): TaxonomyNavNode | null {
  if (!Number.isFinite(rawCategoryId) || rawCategoryId <= 0) return null;

  // Raw DB main ids (e.g. categoryId=104) must bind to the main taxonomy row, not a sub id collision.
  if (rawCategoryId < MAIN_NAV_OFFSET) {
    const mainByDatabaseId = categories.find(
      (node) => node.kind === "main" && sameTaxonomyId(node.mainCategoryId, rawCategoryId),
    );
    if (mainByDatabaseId) return mainByDatabaseId;
  }

  for (const main of categories) {
    if (main.kind !== "main") continue;
    for (const sub of main.children ?? []) {
      if (
        sameTaxonomyId(sub.categoryId, rawCategoryId) ||
        sameTaxonomyId(sub.subCategoryId, rawCategoryId)
      ) {
        return sub;
      }
    }
  }

  const mainMatches = categories.filter(
    (node) => node.kind === "main" && matchesMainUrlParam(node, rawCategoryId),
  );
  if (mainMatches.length > 0) {
    return pickMainFromUrlMatches(mainMatches, rawCategoryId);
  }

  return findCategoryById(categories, rawCategoryId);
}

/**
 * Main taxonomy row for URLs — same rules as {@link resolveCategoryByUrlParam}, always a main node.
 */
export function resolveMainCategoryByUrlParam(
  categories: TaxonomyNavNode[],
  rawCategoryId: number,
): TaxonomyNavNode | null {
  const resolved = resolveCategoryByUrlParam(categories, rawCategoryId);
  if (!resolved) return null;
  if (resolved.kind === "main") return resolved;
  return (
    categories.find(
      (node) => node.kind === "main" && node.mainCategoryId === resolved.mainCategoryId,
    ) ?? null
  );
}

export function resolveSubCategoryByUrlParam(
  parent: TaxonomyNavNode | null,
  rawSubCategoryId: number | null,
): TaxonomyNavNode | null {
  if (parent == null || rawSubCategoryId == null || rawSubCategoryId <= 0) return null;
  return (
    parent.children?.find(
      (sub) =>
        sameTaxonomyId(sub.categoryId, rawSubCategoryId) ||
        sameTaxonomyId(sub.subCategoryId, rawSubCategoryId),
    ) ?? null
  );
}

export function findCategoryById(
  categories: TaxonomyNavNode[],
  categoryId: number,
): TaxonomyNavNode | null {
  for (const category of categories) {
    if (sameTaxonomyId(category.categoryId, categoryId)) return category;
    if (category.kind === "main" && sameTaxonomyId(category.mainCategoryId, categoryId)) {
      return category;
    }
    if (category.kind === "sub" && sameTaxonomyId(category.subCategoryId, categoryId)) {
      return category;
    }
    const nested = findCategoryById(category.children, categoryId);
    if (nested) return nested;
  }
  return null;
}

export function collectCategoryIds(category: TaxonomyNavNode): number[] {
  return [category.categoryId, ...category.children.flatMap(collectCategoryIds)];
}

export function flattenNavCategories(categories: TaxonomyNavNode[]): Array<{
  categoryId: number;
  name: string;
  depth: number;
}> {
  const out: Array<{ categoryId: number; name: string; depth: number }> = [];
  const walk = (nodes: TaxonomyNavNode[], depth: number) => {
    for (const node of nodes) {
      out.push({ categoryId: node.categoryId, name: node.name, depth });
      walk(node.children, depth + 1);
    }
  };
  walk(categories, 0);
  return out;
}

export function filterProductsByNavNode(
  products: MenuProductApiItem[],
  category: TaxonomyNavNode | null,
): MenuProductApiItem[] {
  if (!category) return [];
  if (category.kind === "sub" && category.subCategoryId != null) {
    return products.filter((product) => sameTaxonomyId(product.subCategoryId, category.subCategoryId));
  }
  return products.filter((product) => sameTaxonomyId(product.mainCategoryId, category.mainCategoryId));
}

export function trackIdForNavNode(category: TaxonomyNavNode): number {
  return category.subCategoryId ?? category.mainCategoryId;
}

export function resolveProductNavCategory(
  categories: TaxonomyNavNode[],
  product: MenuProductApiItem,
): TaxonomyNavNode | null {
  if (product.subCategoryId != null) {
    const sub = findCategoryById(categories, product.subCategoryId);
    if (sub) return sub;
  }
  if (product.mainCategoryId != null) {
    return findCategoryById(categories, MAIN_NAV_OFFSET + product.mainCategoryId);
  }
  return null;
}

export function groupProductsByCategory(products: MenuProductApiItem[]) {
  const groups = new Map<string, MenuProductApiItem[]>();
  for (const product of products) {
    const key =
      product.subCategoryName?.trim() ||
      product.mainCategoryName?.trim() ||
      "Genel";
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export function formatMenuPrice(price?: number | string, currency = "TRY") {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (amount == null || !Number.isFinite(amount)) return "";
  const symbol = currency === "TRY" || currency === "TL" ? "₺" : currency;
  return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}
