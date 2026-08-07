import type { MenuNavCategory, TaxonomyNavNode } from "../types";
import { findCategoryById } from "../types";

export function taxonomyNavNodesToRailCategories(
  categories: TaxonomyNavNode[],
): MenuNavCategory[] {
  const out: MenuNavCategory[] = [];
  const walk = (nodes: TaxonomyNavNode[], depth: number) => {
    for (const node of nodes) {
      out.push({
        key: `cat-${node.categoryId}`,
        mainCategoryId: node.mainCategoryId,
        subCategoryId: node.subCategoryId,
        name: node.name,
        depth,
      });
      walk(node.children, depth + 1);
    }
  };
  walk(categories, 0);
  return out;
}

export function resolveNavNodeFromRailCategory(
  categories: TaxonomyNavNode[],
  railCategory: MenuNavCategory,
): TaxonomyNavNode | null {
  if (railCategory.subCategoryId != null) {
    return findCategoryById(categories, railCategory.subCategoryId);
  }
  if (railCategory.mainCategoryId != null) {
    return categories.find((c) => c.mainCategoryId === railCategory.mainCategoryId) ?? null;
  }
  return null;
}
