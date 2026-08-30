import type { BranchItem } from "@/lib/branch";

export type DigitalMenuDirectoryItem = {
  menuId: number;
  qrId: number;
  businessName: string;
  branchId: number;
  branchName: string;
  active: boolean;
};

export type MenuDirectoryStatusFilter = "all" | "active" | "inactive";

export type MenuDirectoryFilters = {
  query: string;
  status: MenuDirectoryStatusFilter;
  branchId: number | "all";
};

export const DEFAULT_MENU_DIRECTORY_FILTERS: MenuDirectoryFilters = {
  query: "",
  status: "all",
  branchId: "all",
};

export function flattenBranchMenus(branches: BranchItem[]): DigitalMenuDirectoryItem[] {
  return branches.flatMap((branch) =>
    branch.menus.map((menu) => ({
      menuId: menu.menuId,
      qrId: menu.qrId,
      businessName: menu.businessName?.trim() || `Menü #${menu.qrId}`,
      branchId: branch.id,
      branchName: branch.name,
      active: menu.active,
    })),
  );
}

export function filterMenuDirectory(
  items: DigitalMenuDirectoryItem[],
  filters: MenuDirectoryFilters,
): DigitalMenuDirectoryItem[] {
  const query = filters.query.trim().toLocaleLowerCase("tr-TR");

  return items.filter((item) => {
    if (filters.status === "active" && !item.active) {
      return false;
    }
    if (filters.status === "inactive" && item.active) {
      return false;
    }
    if (filters.branchId !== "all" && item.branchId !== filters.branchId) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = `${item.businessName} ${item.branchName}`.toLocaleLowerCase("tr-TR");
    return haystack.includes(query);
  });
}

export function sortMenuDirectory(items: DigitalMenuDirectoryItem[]): DigitalMenuDirectoryItem[] {
  return [...items].sort((a, b) => {
    const branchCompare = a.branchName.localeCompare(b.branchName, "tr-TR");
    if (branchCompare !== 0) {
      return branchCompare;
    }
    return a.businessName.localeCompare(b.businessName, "tr-TR");
  });
}
